from fastapi import FastAPI, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import os

from database import engine, Base, get_db
from models import Report
from schemas import ReportUpdate
from routers.reports_dashboard import router as dashboard_router

# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI app
app = FastAPI(
    title="AI Disaster Report System"
)
app.include_router(dashboard_router)

# Include partner's dashboard routes
app.include_router(dashboard_router)
# Home
@app.get("/")
def home():
    return {
        "message": "Disaster Report Backend is running!"
    }


# Create a new report + image upload
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

    if image:
        os.makedirs("uploads", exist_ok=True)

        image_path = f"uploads/{image.filename}"

        with open(image_path, "wb") as file:
            file.write(await image.read())

    new_report = Report(
        description=description,
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        image=image_path
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "Report created successfully",
        "report_id": new_report.id,
        "image": image_path
    }


# Get all reports
@app.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()

    return reports


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