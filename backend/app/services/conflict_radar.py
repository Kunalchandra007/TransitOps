from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.services.dispatch_score import get_ranked_pairs

SERVICE_INTERVAL_KM = Decimal("10000")
SERVICE_WARNING_WINDOW_KM = Decimal("1000")
TRIP_ACTIVE_STATUSES = [TripStatus.draft, TripStatus.dispatched]


async def get_drivers_with_expiry_before(db: AsyncSession, horizon: date) -> list[Driver]:
    today = date.today()
    return (
        await db.execute(
            select(Driver).where(
                Driver.license_expiry >= today,
                Driver.license_expiry <= horizon,
                Driver.status != DriverStatus.suspended,
            )
        )
    ).scalars().all()


async def get_trips_for_driver(db: AsyncSession, driver_id: UUID, status__in: list[TripStatus]) -> list[Trip]:
    return (await db.execute(select(Trip).where(Trip.driver_id == driver_id, Trip.status.in_(status__in)))).scalars().all()


async def get_vehicles_near_service_interval(db: AsyncSession) -> list[Vehicle]:
    vehicles = (
        await db.execute(select(Vehicle).where(Vehicle.status != VehicleStatus.retired))
    ).scalars().all()
    due: list[Vehicle] = []
    for vehicle in vehicles:
        remainder = Decimal(vehicle.odometer or 0) % SERVICE_INTERVAL_KM
        if remainder >= SERVICE_INTERVAL_KM - SERVICE_WARNING_WINDOW_KM:
            due.append(vehicle)
    return due


async def get_trips_for_vehicle(db: AsyncSession, vehicle_id: UUID, status__in: list[TripStatus]) -> list[Trip]:
    return (await db.execute(select(Trip).where(Trip.vehicle_id == vehicle_id, Trip.status.in_(status__in)))).scalars().all()


async def _trip_region(db: AsyncSession, trip: Trip) -> str:
    if trip.vehicle_id:
        vehicle = await db.get(Vehicle, trip.vehicle_id)
        if vehicle and vehicle.region:
            return vehicle.region
    return trip.source


async def get_regional_shortages(db: AsyncSession, horizon: date) -> dict[str, int]:
    trips = (await db.execute(select(Trip).where(Trip.status.in_(TRIP_ACTIVE_STATUSES)))).scalars().all()
    demand: dict[str, int] = defaultdict(int)
    for trip in trips:
        demand[await _trip_region(db, trip)] += 1

    vehicles = (
        await db.execute(select(Vehicle).where(Vehicle.status == VehicleStatus.available))
    ).scalars().all()
    drivers = (
        await db.execute(
            select(Driver).where(
                Driver.status == DriverStatus.available,
                Driver.license_expiry > horizon,
            )
        )
    ).scalars().all()
    vehicle_supply: dict[str, int] = defaultdict(int)
    for vehicle in vehicles:
        vehicle_supply[vehicle.region or "Unassigned"] += 1

    driver_supply = len(drivers)
    shortages: dict[str, int] = {}
    for region, trip_count in demand.items():
        available_capacity = min(vehicle_supply.get(region, 0), driver_supply)
        shortfall = trip_count - available_capacity
        if shortfall > 0:
            shortages[region] = shortfall
    return shortages


async def get_trip(db: AsyncSession, trip_id: UUID) -> Trip | None:
    return await db.get(Trip, trip_id)


async def scan_upcoming_conflicts(db: AsyncSession, horizon_days: int = 7) -> list[dict]:
    conflicts: list[dict] = []
    today = date.today()
    horizon = today + timedelta(days=horizon_days)

    drivers_at_risk = await get_drivers_with_expiry_before(db, horizon)
    for driver in drivers_at_risk:
        upcoming_trips = await get_trips_for_driver(db, driver.id, TRIP_ACTIVE_STATUSES)
        if upcoming_trips:
            conflicts.append({
                "type": "license_expiry",
                "severity": "high",
                "message": f"{driver.name}'s license expires {driver.license_expiry}, but has {len(upcoming_trips)} upcoming trip(s)",
                "entity_id": driver.id,
                "entity_type": "driver",
                "affected_trip_ids": [trip.id for trip in upcoming_trips],
                "region": None,
            })

    vehicles_due = await get_vehicles_near_service_interval(db)
    for vehicle in vehicles_due:
        upcoming_trips = await get_trips_for_vehicle(db, vehicle.id, TRIP_ACTIVE_STATUSES)
        if upcoming_trips:
            conflicts.append({
                "type": "maintenance_due",
                "severity": "medium",
                "message": f"{vehicle.reg_number} is due for service soon but has {len(upcoming_trips)} trip(s) planned",
                "entity_id": vehicle.id,
                "entity_type": "vehicle",
                "affected_trip_ids": [trip.id for trip in upcoming_trips],
                "region": vehicle.region,
            })

    shortages = await get_regional_shortages(db, horizon)
    for region, shortfall in shortages.items():
        conflicts.append({
            "type": "capacity_shortage",
            "severity": "medium",
            "message": f"{region} has {shortfall} more upcoming trip(s) than available drivers/vehicles this week",
            "entity_id": None,
            "entity_type": "region",
            "affected_trip_ids": [],
            "region": region,
        })

    return sorted(conflicts, key=lambda item: {"high": 0, "medium": 1, "low": 2}[item["severity"]])


async def suggest_resolution(conflict: dict, db: AsyncSession) -> list[dict]:
    affected_trip_ids = conflict.get("affected_trip_ids") or []
    if not affected_trip_ids:
        return []
    trip = await get_trip(db, affected_trip_ids[0])
    if not trip:
        return []
    region = await _trip_region(db, trip)
    if conflict["entity_type"] == "driver":
        return await get_ranked_pairs(trip.cargo_weight, region, db, exclude_driver_id=conflict["entity_id"])
    if conflict["entity_type"] == "vehicle":
        return await get_ranked_pairs(trip.cargo_weight, region, db, exclude_vehicle_id=conflict["entity_id"])
    return []
