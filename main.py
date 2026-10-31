from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json

from database import engine, Base, get_db
from models import Report
from schemas import ReportUpdate
from routers.reports_dashboard import router as dashboard_router
from ai.nugen_client import analyze_disaster_report

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


# Root check

# Preview AI Analysis before final submit
@app.post("/analyze-preview")
async def analyze_preview(
    description: str = Form(...)
):
    try:
        ai_response = analyze_disaster_report(description)
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.replace("```json", "").replace("```", "").strip()
        ai_data = json.loads(cleaned_response)
        return {
            "status": "Success",
            "disaster_type": ai_data.get("disaster_category") or ai_data.get("disaster_type") or ai_data.get("category"),
            "severity": ai_data.get("severity", "MODERATE"),
            "confidence": ai_data.get("confidence", 85),
            "reasoning": ai_data.get("reasoning") or ai_data.get("explanation", "AI analysis completed."),
            "human_review_required": ai_data.get("human_review_required", True)
        }
    except Exception as e:
        print("Preview AI Analysis error:", e)
        text_lower = description.lower()
        if any(w in text_lower for w in ['quake', 'tremor', 'earthquake', 'shaking', 'collapsed', 'rubble', 'seismic']):
            return {
                "status": "Fallback",
                "disaster_type": "Earthquake / Structural Damage",
                "severity": "CRITICAL",
                "confidence": 92,
                "reasoning": "Seismic tremor and structural collapse keywords identified from witness account.",
                "human_review_required": True
            }
        elif any(w in text_lower for w in ['fire', 'flame', 'smoke', 'wildfire', 'burn']):
            return {
                "status": "Fallback",
                "disaster_type": "Wildfire / Urban Fire",
                "severity": "CRITICAL",
                "confidence": 90,
                "reasoning": "Combustion plumes and active flame keywords detected.",
                "human_review_required": True
            }
        elif any(w in text_lower for w in ['landslide', 'mudslide', 'rockfall', 'ghat', 'boulder']):
            return {
                "status": "Fallback",
                "disaster_type": "Landslide / Debris Flow",
                "severity": "HIGH",
                "confidence": 88,
                "reasoning": "Geological displacement and slope destabilization indicators present.",
                "human_review_required": True
            }
        elif any(w in text_lower for w in ['flood', 'water', 'submerged', 'inundat', 'drown', 'river', 'rain']):
            return {
                "status": "Fallback",
                "disaster_type": "Flood / Water Inundation",
                "severity": "CRITICAL",
                "confidence": 94,
                "reasoning": "Inundation and severe water accumulation indicators detected.",
                "human_review_required": True
            }
        else:
            return {
                "status": "Fallback",
                "disaster_type": "General Climate Emergency",
                "severity": "MODERATE",
                "confidence": 75,
                "reasoning": "Incident reported with preliminary observation markers.",
                "human_review_required": True
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

    # Run AI analysis
    ai_status = "Failed"
    try:
        ai_response = analyze_disaster_report(description)

        # Convert AI response into JSON
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.replace("```json", "").replace("```", "").strip()

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
        new_report.human_review_required = ai_data.get("human_review_required", True)
        ai_status = "Success"

    except Exception as e:
        print("AI Analysis Error:", str(e))
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