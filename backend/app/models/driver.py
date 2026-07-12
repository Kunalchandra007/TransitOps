import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import DriverStatus


class Driver(Base):
    __tablename__ = "drivers"
    __table_args__ = (Index("ix_drivers_status", "status"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    license_number: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    license_category: Mapped[str | None] = mapped_column(String(20))
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str | None] = mapped_column(String(30))
    safety_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=100)
    status: Mapped[DriverStatus] = mapped_column(Enum(DriverStatus, name="driver_status", values_callable=lambda items: [item.value for item in items]), default=DriverStatus.available)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="driver")
