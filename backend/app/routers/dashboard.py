from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.schemas import ConflictItem, RankedPair, RebalanceSuggestion, StatusWallVehicle
from app.services.conflict_radar import scan_upcoming_conflicts, suggest_resolution
from app.services.fleet_health import compute_health, get_status_wall_data
from app.services.utilization_rebalancer import get_rebalance_suggestions

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
async def kpis(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Vehicle.id)).where(Vehicle.status != VehicleStatus.retired))
    available = await db.scalar(select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.available))
    in_maintenance = await db.scalar(select(func.count(Vehicle.id)).where(Vehicle.status == VehicleStatus.in_shop))
    active_trips = await db.scalar(select(func.count(Trip.id)).where(Trip.status == TripStatus.dispatched))
    pending_trips = await db.scalar(select(func.count(Trip.id)).where(Trip.status == TripStatus.draft))
    drivers_on_duty = await db.scalar(select(func.count(Driver.id)).where(Driver.status == DriverStatus.available))
    utilization = ((total - available) / total * 100) if total else 0
    return {
        "active_vehicles": total,
        "available_vehicles": available,
        "in_maintenance": in_maintenance,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "utilization_pct": round(utilization, 1),
    }


@router.get("/fleet-health")
async def fleet_health(db: AsyncSession = Depends(get_db)):
    vehicles = (await db.execute(select(Vehicle).where(Vehicle.status != VehicleStatus.retired))).scalars().all()
    return [await compute_health(vehicle, db) for vehicle in vehicles]


@router.get("/conflict-radar", response_model=list[ConflictItem])
async def conflict_radar(horizon_days: int = 7, db: AsyncSession = Depends(get_db)):
    return await scan_upcoming_conflicts(db, horizon_days)


@router.get("/conflict-radar/{conflict_index}/suggestions", response_model=list[RankedPair])
async def conflict_radar_suggestions(conflict_index: int, horizon_days: int = 7, db: AsyncSession = Depends(get_db)):
    conflicts = await scan_upcoming_conflicts(db, horizon_days)
    if conflict_index < 0 or conflict_index >= len(conflicts):
        raise HTTPException(status_code=404, detail="Conflict not found")
    return await suggest_resolution(conflicts[conflict_index], db)


@router.get("/rebalance-suggestions", response_model=list[RebalanceSuggestion])
async def rebalance_suggestions(db: AsyncSession = Depends(get_db)):
    return await get_rebalance_suggestions(db)


@router.get("/status-wall", response_model=dict[str, list[StatusWallVehicle]])
async def status_wall(db: AsyncSession = Depends(get_db)):
    return await get_status_wall_data(db)
