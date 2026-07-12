import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MaintenanceStatus


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[MaintenanceStatus] = mapped_column(Enum(MaintenanceStatus, name="maintenance_status", values_callable=lambda items: [item.value for item in items]), default=MaintenanceStatus.open, index=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
