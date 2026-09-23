from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal , get_db
from models import Report
from schemas import ReportCreate
from routers.reports_dashboard import router as dashboard_router


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI app
app = FastAPI(
    title="AI Disaster Report System"
)
app.include_router(dashboard_router)



# Home
@app.get("/")
def home():
    return {
        "message": "Disaster Report Backend is running!"
    }


# Create a new report
@app.post("/reports")
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db)
):
    new_report = Report(
        description=report.description,
        latitude=report.latitude,
        longitude=report.longitude,
        timestamp=report.timestamp
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "Report created successfully",
        "report_id": new_report.id
    }


# Get all reports
@app.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()

    return reports