from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver
from app.models.enums import MaintenanceStatus, TripStatus
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip
from app.models.vehicle import Vehicle

AVG_SPEED_KMH = 55


async def compute_health(vehicle: Vehicle, db: AsyncSession) -> dict:
    flags: list[str] = []
    color = "green"

    open_maintenance = await db.scalar(
        select(func.count(MaintenanceLog.id)).where(
            MaintenanceLog.vehicle_id == vehicle.id,
            MaintenanceLog.status == MaintenanceStatus.open,
        )
    )
    if open_maintenance:
        flags.append("Maintenance overdue")
        color = "red"

    completed = await db.scalar(
        select(func.count(Trip.id)).where(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.completed)
    )
    dispatched = await db.scalar(select(func.count(Trip.id)).where(Trip.vehicle_id == vehicle.id))
    utilization = (completed / dispatched * 100) if dispatched else 0
    if utilization < 20:
        flags.append("Underutilized")
        if color != "red":
            color = "yellow"

    return {"vehicle_id": vehicle.id, "reg_number": vehicle.reg_number, "name": vehicle.name, "color": color, "flags": flags}


async def get_status_wall_data(db: AsyncSession) -> dict[str, list[dict]]:
    vehicles = (await db.execute(select(Vehicle).order_by(Vehicle.reg_number))).scalars().all()
    grouped: dict[str, list[dict]] = {"Available": [], "On Trip": [], "In Shop": [], "Retired": []}

    for vehicle in vehicles:
        active_trip = await db.scalar(
            select(Trip)
            .where(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.dispatched)
            .order_by(Trip.dispatched_at.desc())
            .limit(1)
        )
        driver = await db.get(Driver, active_trip.driver_id) if active_trip and active_trip.driver_id else None
        current_trip = None
        eta_estimate = None
        if active_trip:
            hours = float(active_trip.planned_distance or 0) / AVG_SPEED_KMH
            eta_estimate = f"{hours:.1f}h planned"
            if active_trip.dispatched_at:
                elapsed = datetime.now(timezone.utc) - active_trip.dispatched_at
                eta_estimate = f"{max(0, hours - elapsed.total_seconds() / 3600):.1f}h remaining"
            current_trip = {
                "destination": active_trip.destination,
                "planned_distance": active_trip.planned_distance,
            }

        grouped.setdefault(vehicle.status.value, []).append({
            "reg_number": vehicle.reg_number,
            "type": vehicle.type,
            "status": vehicle.status.value,
            "current_driver_name": driver.name if driver else None,
            "current_trip": current_trip,
            "eta_estimate": eta_estimate,
        })

    return grouped
