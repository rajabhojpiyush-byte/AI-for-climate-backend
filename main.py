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
from ai_service import analyze_text_report, apply_to_report
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


# Preview AI Analysis before final submit
@app.post("/analyze-preview")
async def analyze_preview(
    description: str = Form(...)
):
    ai_result = await asyncio.to_thread(analyze_text_report, description)
    return {
        "status": ai_result["ai_status"],
        "disaster_type": ai_result["disaster_type"],
        "severity": ai_result["severity"],
        "confidence": ai_result["confidence"],
        "priority_score": ai_result["priority_score"],
        "reasoning": ai_result["reasoning"],
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

    # Handle image upload with size limit and automatic server-side compression
    if image and image.filename:
        content = await image.read()
        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image exceeds 10MB limit. Please upload a smaller image."
            )
        image_path = save_optimized_image(content, image.filename)

    # Create report
    new_report = Report(
        description=description,
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        image=image_path
    )

    # Run AI analysis safely (validation, retries, keyword fallback)
    ai_result = await asyncio.to_thread(analyze_text_report, description)
    apply_to_report(new_report, ai_result)

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
        # Create report row
        new_report = Report(
            description=item.description,
            latitude=item.latitude,
            longitude=item.longitude,
            timestamp=item.timestamp,
            image=None
        )

        # Run safe AI pipeline
        ai_result = await asyncio.to_thread(analyze_text_report, item.description)
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
