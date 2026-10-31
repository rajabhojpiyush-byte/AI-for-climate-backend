
from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json

from database import engine, Base, get_db
from models import Report
from schemas import ReportUpdate
from routers.reports_dashboard import router as dashboard_router
from ai.nugen_client import analyze_disaster_report


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI app
app = FastAPI(
    title="AI Disaster Report System"
)
# Include dashboard routes
app.include_router(dashboard_router)
app.include_router(dashboard_router)


# Home
@app.get("/")
def home():
    return {
        "message": "Disaster Report Backend is running!"
    }


# Create a new report + image upload + AI analysis
@app.post("/reports")
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
    if image:
        os.makedirs("uploads", exist_ok=True)

        image_path = f"uploads/{image.filename}"

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

    # Run AI analysis
    ai_status = "Failed"

    try:
        ai_response = analyze_disaster_report(description)

        # Convert AI response into JSON
        cleaned_response = ai_response.strip()

        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.replace(
                "```json", ""
            ).replace("```", "").strip()

        ai_data = json.loads(cleaned_response)

        # Save AI results
        new_report.disaster_type = (
            ai_data.get("disaster_category")
            or ai_data.get("disaster_type")
            or ai_data.get("category")
        )

        new_report.severity = ai_data.get("severity")

        new_report.confidence = ai_data.get("confidence")

        new_report.ai_reasoning = (
            ai_data.get("reasoning")
            or ai_data.get("explanation")
        )

        new_report.human_review_required = ai_data.get(
            "human_review_required", True
        )

        ai_status = "Success"

    except Exception as e:
        print("AI Analysis Error:", str(e))

        # Keep report even if AI fails
        new_report.human_review_required = True
        new_report.ai_reasoning = "AI analysis unavailable. Manual review required."

    # Save report in database
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "Report created successfully",
        "report_id": new_report.id,
        "image": image_path,
        "ai_analysis_status": ai_status,
        "disaster_type": new_report.disaster_type,
        "severity": new_report.severity,
        "confidence": new_report.confidence,
        "ai_reasoning": new_report.ai_reasoning,
        "human_review_required": new_report.human_review_required
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

    return query.all()

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

    return query.all()


# Get single report
@app.get("/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == report_id
    ).first()

    if not report:
        return {
            "message": "Report not found"
        }

    return report


# Update report
@app.patch("/reports/{report_id}")
def update_report(
    report_id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(
        Report.id == report_id
    ).first()

    if not report:
        return {
            "message": "Report not found"
        }

    update_data = report_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)

    return {
        "message": "Report updated successfully",
        "report": report
    }
