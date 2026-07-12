import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import VehicleStatus


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (Index("ix_vehicles_status", "status"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reg_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[str] = mapped_column(String(60), nullable=False)
    region: Mapped[str | None] = mapped_column(String(80))
    max_load_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    odometer: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    acquisition_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[VehicleStatus] = mapped_column(Enum(VehicleStatus, name="vehicle_status", values_callable=lambda items: [item.value for item in items]), default=VehicleStatus.available)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
