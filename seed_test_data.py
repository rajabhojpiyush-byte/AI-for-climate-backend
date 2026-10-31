"""
ResQAI — Test data seeding script

Run this once to populate disaster.db with realistic sample reports.
"""

from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
from models import Report

# Make sure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

now = datetime.utcnow()

sample_reports = [
    # --- Normal, already "AI-processed" reports (simulate what AI will eventually fill in) ---
    Report(
        description="Severe flooding on MG Road, water entering ground-floor shops",
        image="flood_mg_road.jpg",
        latitude=18.5204, longitude=73.8567,
        timestamp=now - timedelta(hours=1),
        disaster_type="flood", confidence=87.5, severity="High",
        is_duplicate=False, priority_score=82.0, status="Pending",
    ),
    Report(
        description="Small kitchen fire in apartment building, contained quickly",
        image="fire_apartment.jpg",
        latitude=18.5300, longitude=73.8450,
        timestamp=now - timedelta(hours=3),
        disaster_type="fire", confidence=91.0, severity="Low",
        is_duplicate=False, priority_score=25.0, status="Verified",
    ),
    Report(
        description="Landslide blocking main highway near hill station",
        image="landslide_highway.jpg",
        latitude=18.7500, longitude=73.4000,
        timestamp=now - timedelta(hours=5),
        disaster_type="landslide", confidence=95.0, severity="Critical",
        is_duplicate=False, priority_score=98.0, status="Verified",
    ),
    Report(
        description="Cyclone warning — coastal area evacuation underway",
        image=None,
        latitude=17.6868, longitude=83.2185,
        timestamp=now - timedelta(hours=2),
        disaster_type="cyclone", confidence=78.0, severity="Critical",
        is_duplicate=False, priority_score=95.0, status="Pending",
    ),

    # --- Duplicate example: same flood incident reported again ---
    Report(
        description="Flood water rising near MG Road shops, people stranded",
        image="flood_mg_road_2.jpg",
        latitude=18.5206, longitude=73.8569,
        timestamp=now - timedelta(minutes=45),
        disaster_type="flood", confidence=83.0, severity="High",
        is_duplicate=True, priority_score=80.0, status="Pending",
    ),

    # --- Resolved report (should NOT appear in high-priority dashboard) ---
    Report(
        description="Minor waterlogging, already cleared by municipal team",
        image=None,
        latitude=18.5100, longitude=73.8600,
        timestamp=now - timedelta(days=1),
        disaster_type="flood", confidence=70.0, severity="Low",
        is_duplicate=False, priority_score=15.0, status="Resolved",
    ),

    # --- Edge case: no image, minimal info ---
    Report(
        description="Heard loud explosion sound near industrial area, unclear cause",
        image=None,
        latitude=18.6000, longitude=73.9000,
        timestamp=now - timedelta(minutes=20),
        disaster_type=None, confidence=None, severity=None,
        is_duplicate=False, priority_score=None, status="Pending",
    ),

    # --- Edge case: freshly submitted, AI hasn't processed it yet ---
    Report(
        description="Strong tremors felt, some cracks appeared in old building wall",
        image="cracks_wall.jpg",
        latitude=18.5400, longitude=73.8300,
        timestamp=now - timedelta(minutes=5),
        disaster_type=None, confidence=None, severity=None,
        is_duplicate=False, priority_score=None, status="Pending",
    ),
]

db.add_all(sample_reports)
db.commit()

print(f"Inserted {len(sample_reports)} test reports into disaster.db")

db.close()