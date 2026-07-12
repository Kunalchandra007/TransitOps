from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.enums import UserRole
from app.models.expense import Expense
from app.models.fuel_log import FuelLog
from app.schemas import ExpenseCreate, ExpenseRead, FuelLogCreate, FuelLogCreateResponse, FuelLogRead
from app.services.cost_engine import check_fuel_anomaly

router = APIRouter(tags=["fuel-expense"])


@router.post("/fuel-logs", response_model=FuelLogCreateResponse, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def create_fuel_log(payload: FuelLogCreate, db: AsyncSession = Depends(get_db)):
    log = FuelLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    anomaly_flags = await check_fuel_anomaly(log.vehicle_id, log.liters, log.cost, log.date, db)
    return {"fuel_log": log, "anomaly_flags": anomaly_flags}


@router.get("/fuel-logs", response_model=list[FuelLogRead])
async def list_fuel_logs(vehicle_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    filters = [FuelLog.vehicle_id == vehicle_id] if vehicle_id else []
    return (await db.execute(select(FuelLog).where(*filters).order_by(FuelLog.date.desc()))).scalars().all()


@router.post("/expenses", response_model=ExpenseRead, dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.driver))])
async def create_expense(payload: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    expense = Expense(**payload.model_dump())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.get("/expenses", response_model=list[ExpenseRead])
async def list_expenses(vehicle_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    filters = [Expense.vehicle_id == vehicle_id] if vehicle_id else []
    return (await db.execute(select(Expense).where(*filters).order_by(Expense.date.desc()))).scalars().all()
