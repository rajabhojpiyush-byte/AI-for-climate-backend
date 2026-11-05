from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json
import asyncio

from database import engine, Base, get_db
from models import Report
from schemas import ReportUpdate, BatchSyncRequest
from routers.reports_dashboard import router as dashboard_router
from ai_service import analyze_text_report, analyze_report, apply_to_report
from duplicate_detection import check_and_flag_duplicate

# Maximum allowed file upload size: 10MB (protects server on slow 2G/3G connections)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="AI Disaster Report System")

# 1. GZip Compression: Compresses all responses > 1KB by 70-80% for 2G/3G networks
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. CORS Configuration (Allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://resq-ai-zeta.vercel.app",  # Production frontend
        "*",  # During hackathon development, allows any origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Serve uploaded images so the frontend can display them
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 4. Include dashboard routes (only once!)
app.include_router(dashboard_router)


def save_optimized_image(raw_bytes: bytes, original_filename: str) -> str:
    """
    Saves an uploaded photo. If Pillow is installed, automatically resizes
    large images to max 1280px and compresses to quality 75 JPEG to drastically
    reduce bandwidth usage when viewed on 2G/3G connections.
    """
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{timestamp}_{original_filename}"
    target_path = f"uploads/{filename}"

    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(raw_bytes))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Downscale if exceeding 1280px on the longest side
        max_dim = 1280
        if max(img.width, img.height) > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        clean_name = f"{timestamp}_{os.path.splitext(original_filename)[0]}.jpg"
        target_path = f"uploads/{clean_name}"
        img.save(target_path, "JPEG", optimize=True, quality=75)
        return target_path
    except Exception:
        # Fallback: Save original bytes directly
        with open(target_path, "wb") as f:
            f.write(raw_bytes)
        return target_path


# Fast lightweight healthcheck for 2G/3G offline sync probes (< 50 bytes)
@app.get("/ping")
def ping():
    return {"status": "ok"}


@app.get("/")
def home():
    return {"message": "Disaster Report Backend is running!"}


def resolve_ai_interpretation(description: str, ai_result: dict = None, has_image: bool = False):
    from ai.severity import calculate_severity
    from ai.priority import calculate_priority_score
    from ai.text.text_classifier import classify_text

    dt = ai_result.get('disaster_type') if ai_result else None
    sev = ai_result.get('severity') if ai_result else None
    conf = ai_result.get('confidence') if ai_result else None
    score = ai_result.get('priority_score') if ai_result else None
    reasoning = ai_result.get('reasoning') if ai_result else None

    text_lower = description.lower()
    if not dt or dt.lower() == 'unknown':
        guess = classify_text(description).get('disaster_type')
        if guess and guess != 'unknown':
            dt = guess.capitalize()
        elif any(k in text_lower for k in ['flood', 'water', 'submerge', 'inundat', 'drown', 'rain']):
            dt = 'Flood'
        elif any(k in text_lower for k in ['fire', 'smoke', 'flame', 'burn', 'blaze']):
            dt = 'Fire'
        elif any(k in text_lower for k in ['landslide', 'mudslide', 'debris', 'rockfall']):
            dt = 'Landslide'
        elif any(k in text_lower for k in ['earthquake', 'quake', 'tremor', 'rubble']):
            dt = 'Earthquake'
        elif any(k in text_lower for k in ['cyclone', 'storm', 'wind', 'hurricane']):
            dt = 'Storm'
        else:
            dt = 'Emergency Incident'
    else:
        dt = dt.capitalize()

    if not sev or not score:
        sev_data = calculate_severity(description)
        sev = (sev_data.get('severity') or 'medium').capitalize()
        raw_conf = sev_data.get('confidence', 0.85)
        conf = round(raw_conf * 100, 1) if raw_conf <= 1 else float(raw_conf)
        if conf == 0.0 and description.strip():
            conf = 80.0
        score = calculate_priority_score(sev, confidence=conf, has_image=has_image)
        reasoning = (
            f"AI assessed {dt} incident as {sev.upper()} severity based on crisis keywords and situational markers. "
            f"Operational triage score assigned at {score}/100."
        )

    return {
        'status': 'Success',
        'disaster_type': dt,
        'severity': sev,
        'confidence': conf or 85.0,
        'priority_score': score or 50.0,
        'reasoning': reasoning or f"{dt} incident registered. AI triage active.",
        'human_review_required': ai_result.get('human_review_required', False) if ai_result else False,
        'review_reasons': ai_result.get('review_reasons', []) if ai_result else [],
    }

# Preview AI Analysis before final submit (Supports live interpretation as user types)
@app.post("/analyze-preview")
async def analyze_preview(
    description: str = Form(...),
    image: UploadFile = File(None)
):
    image_bytes = None
    image_filename = None
    if image and hasattr(image, "filename") and image.filename:
        image_bytes = await image.read()
        image_filename = image.filename

    ai_result = await asyncio.to_thread(
        analyze_report,
        description=description,
        image_bytes=image_bytes,
        image_filename=image_filename
    )
    return {
        "is_valid": ai_result.get("is_valid", True),
        "validation_message": ai_result.get("validation_message", "ok"),
        "status": ai_result["ai_status"],
        "disaster_type": ai_result["disaster_type"],
        "severity": ai_result["severity"],
        "confidence": ai_result["confidence"],
        "priority_score": ai_result["priority_score"],
        "reasoning": ai_result["reasoning"],
        "visual_interpretation": ai_result.get("visual_interpretation"),
        "extracted_tags": ai_result.get("extracted_tags", []),
        "human_review_required": ai_result["human_review_required"],
        "review_reasons": ai_result.get("review_reasons", []),
    }


# Create a new report + image upload + AI analysis
@app.post("/reports", status_code=status.HTTP_201_CREATED)
async def create_report(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    timestamp: datetime = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_path = None
    raw_content = None

    # Handle image upload with size limit and automatic server-side compression
    if image and hasattr(image, "filename") and image.filename:
        raw_content = await image.read()
        if len(raw_content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image exceeds 10MB limit. Please upload a smaller image."
            )
        image_path = save_optimized_image(raw_content, image.filename)

    # Run AI analysis & strict authenticity verification
    ai_result = await asyncio.to_thread(
        analyze_report,
        description=description,
        image_bytes=raw_content,
        image_filename=image.filename if (image and hasattr(image, "filename")) else None
    )

    # PRANK / IRRELEVANT CHECK: If report is not valid, DO NOT persist into database!
    if not ai_result.get("is_valid", True):
        # Clean up uploaded image if saved
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except Exception:
                pass
        rejection_detail = f"Please enter a valid disaster report. {ai_result.get('reasoning', '')}".strip()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=rejection_detail
        )

    # Create report in database only when verified as genuine
    new_report = Report(
        description=description,
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        image=image_path
    )

    apply_to_report(new_report, ai_result)

    # Guarantee report has complete AI data even if external API is unreachable
    resolved = resolve_ai_interpretation(description, ai_result, has_image=bool(image_path))
    if not new_report.severity:
        new_report.severity = resolved["severity"]
    if not new_report.confidence:
        new_report.confidence = resolved["confidence"]
    if not new_report.priority_score:
        new_report.priority_score = resolved["priority_score"]
    if not new_report.disaster_type or new_report.disaster_type == "unknown":
        new_report.disaster_type = resolved["disaster_type"]
    if not new_report.ai_reasoning:
        new_report.ai_reasoning = resolved["reasoning"]

    # Save report in database
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Check for duplicate reports and flag if found
    duplicate_info = check_and_flag_duplicate(db, new_report)

    return {
        "message": "Report created successfully",
        "report_id": new_report.id,
        "image": image_path,
        "is_valid": True,
        "ai_analysis_status": ai_result["ai_status"],
        "disaster_type": new_report.disaster_type,
        "severity": new_report.severity,
        "confidence": new_report.confidence,
        "priority_score": new_report.priority_score,
        "ai_reasoning": new_report.ai_reasoning,
        "human_review_required": new_report.human_review_required,
        "is_duplicate": new_report.is_duplicate,
        "duplicate_info": duplicate_info,
    }


# Offline Batch Sync: Allows 2G/offline clients to upload multiple queued reports in 1 single compressed request
@app.post("/reports/sync-batch", status_code=status.HTTP_200_OK)
async def sync_offline_reports(
    batch: BatchSyncRequest,
    db: Session = Depends(get_db)
):
    if not batch.reports:
        return {
            "message": "No reports to sync",
            "synced_count": 0,
            "duplicates_count": 0,
            "results": []
        }

    results = []
    duplicates_count = 0

    for item in batch.reports:
        # Run safe AI pipeline and authenticity validation
        ai_result = await asyncio.to_thread(analyze_report, description=item.description)

        if not ai_result.get("is_valid", True):
            results.append({
                "client_id": item.client_id,
                "report_id": None,
                "status": f"Rejected: Please enter a valid disaster report. {ai_result.get('reasoning', '')}".strip(),
                "disaster_type": None,
                "severity": None,
                "priority_score": None,
                "is_duplicate": False,
                "duplicate_info": None,
                "human_review_required": True,
            })
            continue

        # Create report row only for valid reports
        new_report = Report(
            description=item.description,
            latitude=item.latitude,
            longitude=item.longitude,
            timestamp=item.timestamp,
            image=None
        )
        apply_to_report(new_report, ai_result)

        # Save to database
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        # Check for duplicates across existing database
        duplicate_info = check_and_flag_duplicate(db, new_report)
        if new_report.is_duplicate:
            duplicates_count += 1

        results.append({
            "client_id": item.client_id,
            "report_id": new_report.id,
            "status": "Success",
            "disaster_type": new_report.disaster_type,
            "severity": new_report.severity,
            "priority_score": new_report.priority_score,
            "is_duplicate": new_report.is_duplicate,
            "duplicate_info": duplicate_info,
            "human_review_required": new_report.human_review_required,
        })

    return {
        "message": f"Successfully synced {len(results)} offline reports",
        "synced_count": len(results),
        "duplicates_count": duplicates_count,
        "results": results
    }


# Get all reports (with optional filters)
@app.get("/reports")
def get_reports(
    status: str | None = None,
    severity: str | None = None,
    disaster_type: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Report)

    if status:
        query = query.filter(Report.status == status)
    if severity:
        query = query.filter(Report.severity == severity)
    if disaster_type:
        query = query.filter(Report.disaster_type == disaster_type)

    return query.order_by(Report.timestamp.desc()).all()


# Get single report
@app.get("/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


# Update report
@app.patch("/reports/{report_id}")
def update_report(
    report_id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    update_data = report_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)

    return {
        "message": "Report updated successfully",
        "report": report
    }