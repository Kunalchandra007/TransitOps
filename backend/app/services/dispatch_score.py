from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle


async def get_relative_efficiency_score(vehicle: Vehicle, db: AsyncSession) -> float:
    stmt = (
        select(Trip.vehicle_id, func.sum(Trip.actual_distance), func.sum(Trip.fuel_consumed))
        .where(Trip.status == TripStatus.completed, Trip.actual_distance.is_not(None), Trip.fuel_consumed.is_not(None))
        .group_by(Trip.vehicle_id)
    )
    rows = (await db.execute(stmt)).all()
    efficiencies = {
        vehicle_id: float(distance / fuel)
        for vehicle_id, distance, fuel in rows
        if fuel and float(fuel) > 0 and distance
    }
    if not efficiencies:
        return 70.0
    fleet_avg = sum(efficiencies.values()) / len(efficiencies)
    vehicle_eff = efficiencies.get(vehicle.id, fleet_avg)
    return max(0.0, min(100.0, 50.0 + ((vehicle_eff - fleet_avg) / fleet_avg) * 50.0))


async def get_idle_bonus(vehicle: Vehicle, driver: Driver, db: AsyncSession) -> float:
    vehicle_last = await db.scalar(
        select(func.max(Trip.completed_at)).where(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.completed)
    )
    driver_last = await db.scalar(
        select(func.max(Trip.completed_at)).where(Trip.driver_id == driver.id, Trip.status == TripStatus.completed)
    )
    today = date.today()

    def days_idle(value) -> int:
        if not value:
            return 30
        return max(0, (today - value.date()).days)

    avg_days = (days_idle(vehicle_last) + days_idle(driver_last)) / 2
    return max(0.0, min(100.0, avg_days / 30 * 100))


async def compute_fit_score(vehicle: Vehicle, driver: Driver, cargo_weight: Decimal, db: AsyncSession) -> tuple[float, list[str]]:
    load_ratio = float(cargo_weight / vehicle.max_load_kg)
    capacity_score = max(0.0, 100 - abs(0.75 - load_ratio) * 100)
    safety_score = float(driver.safety_score)
    efficiency_score = await get_relative_efficiency_score(vehicle, db)
    idle_score = await get_idle_bonus(vehicle, driver, db)
    fit_score = capacity_score * 0.35 + safety_score * 0.30 + efficiency_score * 0.20 + idle_score * 0.15

    reasons: list[str] = []
    if capacity_score > 80:
        reasons.append("Good capacity match")
    if safety_score > 85:
        reasons.append("High safety score")
    if idle_score > 70:
        reasons.append("Been idle - needs utilization")
    if efficiency_score > 75:
        reasons.append("Fuel efficient vehicle")
    return round(fit_score, 1), reasons


async def get_ranked_pairs(
    cargo_weight: Decimal,
    region: str | None,
    db: AsyncSession,
    exclude_driver_id: UUID | None = None,
    exclude_vehicle_id: UUID | None = None,
) -> list[dict]:
    vehicle_filters = [
        Vehicle.status == VehicleStatus.available,
        Vehicle.max_load_kg >= cargo_weight,
    ]
    if region:
        vehicle_filters.append(Vehicle.region == region)
    if exclude_vehicle_id:
        vehicle_filters.append(Vehicle.id != exclude_vehicle_id)
    vehicles = (await db.execute(select(Vehicle).where(*vehicle_filters))).scalars().all()
    driver_filters = [
        Driver.status == DriverStatus.available,
        Driver.license_expiry > date.today(),
    ]
    if exclude_driver_id:
        driver_filters.append(Driver.id != exclude_driver_id)
    drivers = (await db.execute(select(Driver).where(*driver_filters))).scalars().all()

    pairs: list[dict] = []
    for vehicle in vehicles:
        for driver in drivers:
            score, reasons = await compute_fit_score(vehicle, driver, cargo_weight, db)
            pairs.append({"vehicle": vehicle, "driver": driver, "score": score, "reasons": reasons})
    return sorted(pairs, key=lambda item: item["score"], reverse=True)[:5]
