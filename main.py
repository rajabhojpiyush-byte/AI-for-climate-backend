from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json
import asyncio

from database import engine, Base, get_db
from models import Report
from schemas import ReportUpdate
from routers.reports_dashboard import router as dashboard_router
from ai_service import analyze_text_report, apply_to_report
from duplicate_detection import check_and_flag_duplicate

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="AI Disaster Report System")

# 1. CORS Configuration (Allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",  # During hackathon development, allows any origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Serve uploaded images so the frontend can display them
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 3. Include dashboard routes (only once!)
app.include_router(dashboard_router)



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
    description: str = Form(...)
):
    ai_result = await asyncio.to_thread(analyze_text_report, description)
    return resolve_ai_interpretation(description, ai_result)



@app.get("/")
def home():
    return {"message": "Disaster Report Backend is running!"}


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

    # Save uploaded image
    if image and image.filename:
        # Prepend timestamp to avoid file name collisions
        filename = f"{int(datetime.utcnow().timestamp())}_{image.filename}"
        image_path = f"uploads/{filename}"

        with open(image_path, "wb") as file:
            file.write(await image.read())

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
