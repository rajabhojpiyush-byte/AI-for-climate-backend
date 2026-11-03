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
