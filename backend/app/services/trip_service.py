from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver
from app.models.enums import DriverStatus, TripStatus, VehicleStatus
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.services.dispatch_score import compute_fit_score


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=400, detail=message)


async def dispatch_trip(trip_id: UUID, vehicle_id: UUID, driver_id: UUID, db: AsyncSession) -> Trip:
    trip = await db.get(Trip, trip_id)
    vehicle = await db.get(Vehicle, vehicle_id)
    driver = await db.get(Driver, driver_id)
    if not trip or not vehicle or not driver:
        raise bad_request("Trip, vehicle, or driver not found")
    if trip.status != TripStatus.draft:
        raise bad_request("Only draft trips can be dispatched")
    if vehicle.status != VehicleStatus.available:
        raise bad_request("Vehicle not available")
    if driver.status != DriverStatus.available:
        raise bad_request("Driver not available")
    if driver.license_expiry <= date.today():
        raise bad_request("Driver license expired")
    if driver.status == DriverStatus.suspended:
        raise bad_request("Driver suspended")
    if trip.cargo_weight > vehicle.max_load_kg:
        raise bad_request("Cargo exceeds capacity")

    score, _ = await compute_fit_score(vehicle, driver, trip.cargo_weight, db)
    vehicle.status = VehicleStatus.on_trip
    driver.status = DriverStatus.on_trip
    trip.vehicle_id = vehicle.id
    trip.driver_id = driver.id
    trip.status = TripStatus.dispatched
    trip.dispatch_score = Decimal(str(score))
    trip.dispatched_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(trip)
    return trip


async def complete_trip(trip_id: UUID, actual_distance: Decimal, fuel_consumed: Decimal, db: AsyncSession) -> Trip:
    trip = await db.get(Trip, trip_id)
    if not trip or trip.status != TripStatus.dispatched:
        raise bad_request("Only dispatched trips can be completed")
    vehicle = await db.get(Vehicle, trip.vehicle_id)
    driver = await db.get(Driver, trip.driver_id)
    if not vehicle or not driver:
        raise bad_request("Trip assignment is incomplete")

    trip.status = TripStatus.completed
    trip.actual_distance = actual_distance
    trip.fuel_consumed = fuel_consumed
    trip.completed_at = datetime.now(timezone.utc)
    vehicle.status = VehicleStatus.available
    driver.status = DriverStatus.available
    await db.commit()
    await db.refresh(trip)
    return trip


async def cancel_trip(trip_id: UUID, db: AsyncSession) -> Trip:
    trip = await db.get(Trip, trip_id)
    if not trip or trip.status != TripStatus.dispatched:
        raise bad_request("Only dispatched trips can be cancelled")
    vehicle = await db.get(Vehicle, trip.vehicle_id)
    driver = await db.get(Driver, trip.driver_id)
    if not vehicle or not driver:
        raise bad_request("Trip assignment is incomplete")

    trip.status = TripStatus.cancelled
    trip.cancelled_at = datetime.now(timezone.utc)
    vehicle.status = VehicleStatus.available
    driver.status = DriverStatus.available
    await db.commit()
    await db.refresh(trip)
    return trip
