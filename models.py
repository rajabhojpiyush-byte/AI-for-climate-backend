from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base


class Report(Base):

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    description = Column(String, nullable=False)

    image = Column(String, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    timestamp = Column(DateTime, nullable=False)

    disaster_type = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    severity = Column(String, nullable=True)

    is_duplicate = Column(Boolean, default=False)

    priority_score = Column(Float, nullable=True)

    status = Column(String, default="Pending")