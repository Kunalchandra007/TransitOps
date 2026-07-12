import csv
import io
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.rbac import require_role
from app.database import get_db
from app.models.enums import TripStatus, UserRole
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.services.cost_engine import fuel_efficiency, operational_cost, vehicle_roi

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(require_role(UserRole.fleet_manager, UserRole.safety_officer, UserRole.financial_analyst))])


@router.get("/fuel-efficiency")
async def fuel_efficiency_report(vehicle_id: UUID, db: AsyncSession = Depends(get_db)):
    return {"vehicle_id": vehicle_id, "km_per_liter": await fuel_efficiency(vehicle_id, db)}


@router.get("/utilization")
async def utilization_report(from_date: date | None = None, to_date: date | None = None, db: AsyncSession = Depends(get_db)):
    filters = [Trip.status == TripStatus.completed]
    if from_date:
        filters.append(Trip.completed_at >= from_date)
    if to_date:
        filters.append(Trip.completed_at <= to_date)
    rows = (await db.execute(
        select(Vehicle.id, Vehicle.reg_number, Vehicle.name, func.count(Trip.id))
        .join(Trip, Trip.vehicle_id == Vehicle.id)
        .where(*filters)
        .group_by(Vehicle.id)
    )).all()
    
    result = []
    for vehicle_id, reg, name, count in rows:
        eff = await fuel_efficiency(vehicle_id, db)
        roi = await vehicle_roi(vehicle_id, db)
        cost = await operational_cost(vehicle_id, db, from_date, to_date)
        result.append({
            "vehicle_id": vehicle_id,
            "reg_number": reg,
            "name": name,
            "completed_trips": count,
            "fuel_efficiency": eff,
            "roi": roi,
            "cost": cost
        })
    return result


@router.get("/operational-cost")
async def operational_cost_report(vehicle_id: UUID | None = None, from_date: date | None = None, to_date: date | None = None, db: AsyncSession = Depends(get_db)):
    return {"vehicle_id": vehicle_id, "cost": await operational_cost(vehicle_id, db, from_date, to_date)}


@router.get("/roi")
async def roi_report(vehicle_id: UUID, db: AsyncSession = Depends(get_db)):
    return {"vehicle_id": vehicle_id, "roi": await vehicle_roi(vehicle_id, db)}


@router.get("/export")
async def export_report(type: str = "csv", report: str = "utilization", db: AsyncSession = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["report", "metric", "value"])
    if report == "operational-cost":
        writer.writerow([report, "cost", await operational_cost(None, db)])
    else:
        count = await db.scalar(select(func.count(Trip.id)).where(Trip.status == TripStatus.completed))
        writer.writerow([report, "completed_trips", count])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={report}.csv"})
