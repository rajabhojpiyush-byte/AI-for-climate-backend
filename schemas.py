from pydantic import BaseModel
from datetime import datetime


class ReportCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    timestamp: datetime