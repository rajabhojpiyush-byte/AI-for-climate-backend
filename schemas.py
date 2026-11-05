from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ReportCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    timestamp: datetime


class ReportUpdate(BaseModel):
    status: str | None = None
    disaster_type: str | None = None
    severity: str | None = None
    confidence: float | None = None
    priority_score: float | None = None
    is_duplicate: bool | None = None


# Schema for an individual report queued offline on a citizen or volunteer's device
class OfflineReportItem(BaseModel):
    client_id: Optional[str] = None  # Temporary ID assigned by client (e.g., "offline-1")
    description: str
    latitude: float
    longitude: float
    timestamp: datetime


# Schema for batch sync of multiple queued offline reports over 2G/3G
class BatchSyncRequest(BaseModel):
    reports: List[OfflineReportItem]
