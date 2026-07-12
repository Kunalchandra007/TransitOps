from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.enums import TripStatus, UserRole
from app.models.trip import Trip
from app.schemas import CompleteTripRequest, DispatchRequest, RankedPair, TripCreate, TripRead
from app.services.dispatch_score import get_ranked_pairs
from app.services.trip_service import cancel_trip, complete_trip, dispatch_trip

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripRead])
async def list_trips(status: TripStatus | None = None, vehicle_id: UUID | None = None, driver_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    filters = []
    if status:
        filters.append(Trip.status == status)
    if vehicle_id:
        filters.append(Trip.vehicle_id == vehicle_id)
    if driver_id:
        filters.append(Trip.driver_id == driver_id)
    return (await db.execute(select(Trip).where(*filters).order_by(Trip.created_at.desc()))).scalars().all()


@router.post("", response_model=TripRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def create_trip(payload: TripCreate, db: AsyncSession = Depends(get_db)):
    trip = Trip(**payload.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.get("/eligible-vehicles", response_model=list[RankedPair])
async def eligible_vehicles(cargo_weight: Decimal, region: str | None = None, db: AsyncSession = Depends(get_db)):
    return await get_ranked_pairs(cargo_weight, region, db)


@router.get("/eligible-drivers")
async def eligible_drivers(cargo_weight: Decimal = Decimal("0"), region: str | None = None, db: AsyncSession = Depends(get_db)):
    return await get_ranked_pairs(cargo_weight, region, db)


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(trip_id: UUID, db: AsyncSession = Depends(get_db)):
    trip = await db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def dispatch(trip_id: UUID, payload: DispatchRequest, db: AsyncSession = Depends(get_db)):
    return await dispatch_trip(trip_id, payload.vehicle_id, payload.driver_id, db)


@router.post("/{trip_id}/complete", response_model=TripRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def complete(trip_id: UUID, payload: CompleteTripRequest, db: AsyncSession = Depends(get_db)):
    return await complete_trip(trip_id, payload.actual_distance, payload.fuel_consumed, db)


@router.post("/{trip_id}/cancel", response_model=TripRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def cancel(trip_id: UUID, db: AsyncSession = Depends(get_db)):
    return await cancel_trip(trip_id, db)
