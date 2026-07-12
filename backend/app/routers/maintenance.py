from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.enums import MaintenanceStatus, UserRole
from app.models.maintenance import MaintenanceLog
from app.schemas import MaintenanceCreate, MaintenanceRead
from app.services.maintenance_service import close_maintenance, open_maintenance

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("", response_model=list[MaintenanceRead])
async def list_maintenance(status: MaintenanceStatus | None = None, vehicle_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    filters = []
    if status:
        filters.append(MaintenanceLog.status == status)
    if vehicle_id:
        filters.append(MaintenanceLog.vehicle_id == vehicle_id)
    return (await db.execute(select(MaintenanceLog).where(*filters).order_by(MaintenanceLog.opened_at.desc()))).scalars().all()


@router.post("", response_model=MaintenanceRead, dependencies=[Depends(require_role(UserRole.fleet_manager))])
async def create_maintenance(payload: MaintenanceCreate, db: AsyncSession = Depends(get_db)):
    return await open_maintenance(MaintenanceLog(**payload.model_dump()), db)


@router.post("/{log_id}/close", response_model=MaintenanceRead, dependencies=[Depends(require_role(UserRole.fleet_manager))])
async def close(log_id: UUID, db: AsyncSession = Depends(get_db)):
    return await close_maintenance(log_id, db)
