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