from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.models.fuel_log import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip
from app.models.vehicle import Vehicle


def _date_filter(column, from_date: date | None, to_date: date | None):
    filters = []
    if from_date:
        filters.append(column >= from_date)
    if to_date:
        filters.append(column <= to_date)
    return filters


async def operational_cost(vehicle_id: UUID | None, db: AsyncSession, from_date: date | None = None, to_date: date | None = None) -> float:
    fuel_filters = _date_filter(FuelLog.date, from_date, to_date)
    expense_filters = _date_filter(Expense.date, from_date, to_date)
    maintenance_filters = []
    if from_date:
        maintenance_filters.append(MaintenanceLog.opened_at >= from_date)
    if to_date:
        maintenance_filters.append(MaintenanceLog.opened_at <= to_date)
    if vehicle_id:
        fuel_filters.append(FuelLog.vehicle_id == vehicle_id)
        expense_filters.append(Expense.vehicle_id == vehicle_id)
        maintenance_filters.append(MaintenanceLog.vehicle_id == vehicle_id)

    fuel_total = await db.scalar(select(func.coalesce(func.sum(FuelLog.cost), 0)).where(*fuel_filters))
    expense_total = await db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).where(*expense_filters))
    maintenance_total = await db.scalar(select(func.coalesce(func.sum(MaintenanceLog.cost), 0)).where(*maintenance_filters))
    return float(fuel_total + expense_total + maintenance_total)


async def fuel_efficiency(vehicle_id: UUID, db: AsyncSession) -> float | None:
    distance = await db.scalar(select(func.coalesce(func.sum(Trip.actual_distance), 0)).where(Trip.vehicle_id == vehicle_id))
    fuel = await db.scalar(select(func.coalesce(func.sum(Trip.fuel_consumed), 0)).where(Trip.vehicle_id == vehicle_id))
    return float(distance / fuel) if fuel else None


async def vehicle_roi(vehicle_id: UUID, db: AsyncSession) -> float | None:
    vehicle = await db.get(Vehicle, vehicle_id)
    if not vehicle or not vehicle.acquisition_cost:
        return None
    trip_count = await db.scalar(select(func.count(Trip.id)).where(Trip.vehicle_id == vehicle_id))
    revenue_proxy = float(trip_count or 0) * 1200.0
    cost = await operational_cost(vehicle_id, db)
    return (revenue_proxy - cost) / float(vehicle.acquisition_cost)


async def get_fleet_avg_cost_per_liter(db: AsyncSession, vehicle_type: str | None = None) -> float:
    stmt = select(func.sum(FuelLog.cost), func.sum(FuelLog.liters)).join(Vehicle, FuelLog.vehicle_id == Vehicle.id)
    if vehicle_type:
        stmt = stmt.where(Vehicle.type == vehicle_type)
    total_cost, total_liters = (await db.execute(stmt)).one()
    if not total_liters:
        return 0.0
    return float(total_cost / total_liters)


async def get_last_fuel_log(vehicle_id: UUID, db: AsyncSession) -> FuelLog | None:
    return (
        await db.execute(
            select(FuelLog)
            .where(FuelLog.vehicle_id == vehicle_id)
            .order_by(FuelLog.date.desc(), FuelLog.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


async def get_distance_since(vehicle_id: UUID, since_date: date, db: AsyncSession) -> Decimal:
    distance = await db.scalar(
        select(func.coalesce(func.sum(Trip.actual_distance), 0)).where(
            Trip.vehicle_id == vehicle_id,
            Trip.completed_at >= since_date,
        )
    )
    return Decimal(distance or 0)


async def estimate_expected_liters(vehicle_id: UUID, distance_since: Decimal, db: AsyncSession) -> float:
    efficiency = await fuel_efficiency(vehicle_id, db)
    if not efficiency:
        return float(distance_since) / 8 if distance_since else 0.0
    return float(distance_since) / efficiency if efficiency else 0.0


async def is_duplicate_entry(vehicle_id: UUID, entry_date: date, cost: Decimal, db: AsyncSession) -> bool:
    count = await db.scalar(
        select(func.count(FuelLog.id)).where(
            FuelLog.vehicle_id == vehicle_id,
            FuelLog.date == entry_date,
            FuelLog.cost == cost,
        )
    )
    return bool(count and count > 1)


async def check_fuel_anomaly(vehicle_id: UUID, liters: Decimal, cost: Decimal, entry_date: date, db: AsyncSession) -> list[str]:
    flags: list[str] = []
    vehicle = await db.get(Vehicle, vehicle_id)
    fleet_avg_cost_per_liter = await get_fleet_avg_cost_per_liter(db, vehicle.type if vehicle else None)
    this_cost_per_liter = float(cost / liters) if liters else 0.0

    if fleet_avg_cost_per_liter and this_cost_per_liter > fleet_avg_cost_per_liter * 1.4:
        flags.append(
            f"Cost/liter ({this_cost_per_liter:.2f}) is 40%+ above fleet average ({fleet_avg_cost_per_liter:.2f})"
        )

    last_fill = await get_last_fuel_log(vehicle_id, db)
    if last_fill and last_fill.date != entry_date:
        distance_since = await get_distance_since(vehicle_id, last_fill.date, db)
        expected_liters = await estimate_expected_liters(vehicle_id, distance_since, db)
        if expected_liters and float(liters) > expected_liters * 1.5:
            flags.append(f"Liters filled ({float(liters):.1f}) far exceeds expected usage since last fill (~{expected_liters:.1f}L)")

    if await is_duplicate_entry(vehicle_id, entry_date, cost, db):
        flags.append("Possible duplicate entry - same vehicle, date, and amount already logged")

    return flags
