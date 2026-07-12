from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.driver import Driver
from app.models.enums import DriverStatus, UserRole
from app.schemas import DriverCreate, DriverRead, DriverUpdate

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=list[DriverRead])
async def list_drivers(status: DriverStatus | None = None, license_category: str | None = None, db: AsyncSession = Depends(get_db)):
    filters = []
    if status:
        filters.append(Driver.status == status)
    if license_category:
        filters.append(Driver.license_category == license_category)
    return (await db.execute(select(Driver).where(*filters).order_by(Driver.created_at.desc()))).scalars().all()


@router.post("", response_model=DriverRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.safety_officer))])
async def create_driver(payload: DriverCreate, db: AsyncSession = Depends(get_db)):
    driver = Driver(**payload.model_dump())
    db.add(driver)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Driver license already exists") from exc
    await db.refresh(driver)
    return driver


@router.get("/{driver_id}", response_model=DriverRead)
async def get_driver(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    driver = await db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/{driver_id}", response_model=DriverRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.safety_officer))])
async def update_driver(driver_id: UUID, payload: DriverUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    raw = await request.json()
    if "status" in raw:
        raise HTTPException(status_code=400, detail="Driver status cannot be edited directly")
    driver = await db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, key, value)
    await db.commit()
    await db.refresh(driver)
    return driver
