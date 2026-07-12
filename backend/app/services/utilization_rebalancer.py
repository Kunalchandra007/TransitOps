from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.services.dispatch_score import compute_fit_score
from app.services.fleet_health import compute_health


async def get_idle_days(vehicle: Vehicle, db: AsyncSession) -> int:
    last_completed = await db.scalar(
        select(func.max(Trip.completed_at)).where(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.completed)
    )
    if not last_completed:
        return 30
    return max(0, (date.today() - last_completed.date()).days)


async def get_eligible_drivers_for_trip(trip: Trip, db: AsyncSession) -> list[Driver]:
    return (
        await db.execute(
            select(Driver).where(
                Driver.status == DriverStatus.available,
                Driver.license_expiry > date.today(),
            )
        )
    ).scalars().all()


async def get_rebalance_suggestions(db: AsyncSession) -> list[dict]:
    vehicles = (
        await db.execute(select(Vehicle).where(Vehicle.status == VehicleStatus.available))
    ).scalars().all()
    suggestions: list[dict] = []

    for vehicle in vehicles:
        health = await compute_health(vehicle, db)
        if "Underutilized" not in health["flags"]:
            continue

        trip_filters = [Trip.status == TripStatus.draft, Trip.cargo_weight <= vehicle.max_load_kg]
        if vehicle.region:
            trip_filters.append(Trip.source == vehicle.region)
        draft_trips = (await db.execute(select(Trip).where(*trip_filters))).scalars().all()
        idle_days = await get_idle_days(vehicle, db)

        for trip in draft_trips:
            ranked_drivers: list[tuple[float, list[str], Driver]] = []
            for driver in await get_eligible_drivers_for_trip(trip, db):
                score, reasons = await compute_fit_score(vehicle, driver, trip.cargo_weight, db)
                ranked_drivers.append((score, reasons, driver))
            ranked_drivers.sort(key=lambda item: item[0], reverse=True)
            if ranked_drivers and ranked_drivers[0][0] > 70:
                score, reasons, driver = ranked_drivers[0]
                suggestions.append({
                    "vehicle_id": vehicle.id,
                    "vehicle_reg": vehicle.reg_number,
                    "trip_id": trip.id,
                    "driver_id": driver.id,
                    "score": score,
                    "reasons": reasons,
                    "idle_days": idle_days,
                })
                break

    return sorted(suggestions, key=lambda item: item["idle_days"], reverse=True)
