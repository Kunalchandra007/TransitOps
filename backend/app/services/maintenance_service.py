from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MaintenanceStatus, VehicleStatus
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle


async def open_maintenance(log: MaintenanceLog, db: AsyncSession) -> MaintenanceLog:
    vehicle = await db.get(Vehicle, log.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=400, detail="Vehicle not found")
    if vehicle.status == VehicleStatus.retired:
        raise HTTPException(status_code=400, detail="Retired vehicles cannot enter maintenance")
    vehicle.status = VehicleStatus.in_shop
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def close_maintenance(log_id: UUID, db: AsyncSession) -> MaintenanceLog:
    log = await db.get(MaintenanceLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    vehicle = await db.get(Vehicle, log.vehicle_id)
    log.status = MaintenanceStatus.closed
    log.closed_at = datetime.now(timezone.utc)
    if vehicle and vehicle.status != VehicleStatus.retired:
        vehicle.status = VehicleStatus.available
    await db.commit()
    await db.refresh(log)
    return log
