"""
ResQAI — Partner's supporting endpoints (per official work plan)

  PATCH /reports/{id}            -> update status / partial update
  GET   /dashboard/stats         -> counts: total, by status, by severity
  GET   /dashboard/recent        -> most recently submitted reports
  GET   /dashboard/high-priority -> top priority, non-duplicate, unresolved reports

Does NOT redefine GET /reports or POST /reports — those already exist
in main.py (teammate's code). This router only adds new routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import Report

router = APIRouter()


# ---------- Response schema (matches the real Report model) ----------

class ReportOut(BaseModel):
    id: int
    description: str
    image: Optional[str]
    latitude: float
    longitude: float
    timestamp: datetime
    disaster_type: Optional[str]
    confidence: Optional[float]
    severity: Optional[str]
    is_duplicate: bool
    priority_score: Optional[float]
    status: str

    class Config:
        from_attributes = True


class ReportUpdateIn(BaseModel):
    # All optional — send only the field(s) you want to change.
    # Most common use: just {"status": "Verified"}
    status: Optional[str] = None
    severity: Optional[str] = None
    disaster_type: Optional[str] = None


class DashboardStatsOut(BaseModel):
    total_reports: int
    by_status: dict
    by_severity: dict
    duplicates_count: int


# ---------- GET /dashboard/stats ----------

@router.get("/dashboard/stats", response_model=DashboardStatsOut)
def dashboard_stats(db: Session = Depends(get_db)):
    all_reports = db.query(Report).all()

    by_status = {}
    by_severity = {}
    duplicates_count = 0

    for r in all_reports:
        by_status[r.status] = by_status.get(r.status, 0) + 1
        if r.severity:
            by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
        if r.is_duplicate:
            duplicates_count += 1

    return DashboardStatsOut(
        total_reports=len(all_reports),
        by_status=by_status,
        by_severity=by_severity,
        duplicates_count=duplicates_count,
    )


# ---------- GET /dashboard/recent ----------

@router.get("/dashboard/recent", response_model=List[ReportOut])
def dashboard_recent(
    db: Session = Depends(get_db),
    limit: int = Query(10, le=100),
):
    return (
        db.query(Report)
        .order_by(desc(Report.timestamp))
        .limit(limit)
        .all()
    )


# ---------- GET /dashboard/high-priority ----------

@router.get("/dashboard/high-priority", response_model=List[ReportOut])
def dashboard_high_priority(
    db: Session = Depends(get_db),
    limit: int = Query(10, le=100),
):
    return (
        db.query(Report)
        .filter(Report.status != "Resolved", Report.is_duplicate == False)  # noqa: E712
        .order_by(desc(Report.priority_score))
        .limit(limit)
        .all()
    )