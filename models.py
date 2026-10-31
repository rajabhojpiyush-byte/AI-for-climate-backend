
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base


class Report(Base):

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    # Citizen Report Details
    description = Column(String, nullable=False)
    image = Column(String, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    timestamp = Column(DateTime, nullable=False)

    # AI Analysis Results
    disaster_type = Column(String, nullable=True)

    confidence = Column(Float, nullable=True)

    severity = Column(String, nullable=True)

    ai_reasoning = Column(String, nullable=True)

    human_review_required = Column(Boolean, default=True)

    # Duplicate Detection
    is_duplicate = Column(Boolean, default=False)

    # Priority Management
    priority_score = Column(Float, nullable=True)

    # Report Status
    status = Column(String, default="Pending")
