import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import TripStatus


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("cargo_weight >= 0", name="cargo_within_capacity"),
        Index("ix_trips_status", "status"),
        Index("ix_trips_vehicle_id", "vehicle_id"),
        Index("ix_trips_driver_id", "driver_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(160), nullable=False)
    destination: Mapped[str] = mapped_column(String(160), nullable=False)
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"))
    driver_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id"))
    cargo_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    planned_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    actual_distance: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    fuel_consumed: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    status: Mapped[TripStatus] = mapped_column(Enum(TripStatus, name="trip_status", values_callable=lambda items: [item.value for item in items]), default=TripStatus.draft)
    dispatch_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
