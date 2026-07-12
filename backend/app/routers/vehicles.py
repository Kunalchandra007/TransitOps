from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.enums import UserRole, VehicleStatus
from app.models.vehicle import Vehicle
from app.schemas import VehicleCreate, VehicleRead, VehicleUpdate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleRead])
async def list_vehicles(status: VehicleStatus | None = None, type: str | None = None, region: str | None = None, db: AsyncSession = Depends(get_db)):
    filters = []
    if status:
        filters.append(Vehicle.status == status)
    if type:
        filters.append(Vehicle.type == type)
    if region:
        filters.append(Vehicle.region == region)
    return (await db.execute(select(Vehicle).where(*filters).order_by(Vehicle.created_at.desc()))).scalars().all()


@router.post("", response_model=VehicleRead, dependencies=[Depends(require_role(UserRole.fleet_manager))])
async def create_vehicle(payload: VehicleCreate, db: AsyncSession = Depends(get_db)):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Vehicle registration already exists") from exc
    await db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(vehicle_id: UUID, db: AsyncSession = Depends(get_db)):
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleRead, dependencies=[Depends(require_role(UserRole.fleet_manager))])
async def update_vehicle(vehicle_id: UUID, payload: VehicleUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    raw = await request.json()
    if "status" in raw:
        raise HTTPException(status_code=400, detail="Vehicle status cannot be edited directly")
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", response_model=VehicleRead, dependencies=[Depends(require_role(UserRole.fleet_manager))])
async def retire_vehicle(vehicle_id: UUID, db: AsyncSession = Depends(get_db)):
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.status = VehicleStatus.retired
    await db.commit()
    await db.refresh(vehicle)
    return vehicle
