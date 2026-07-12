import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from app.auth.jwt_handler import hash_password
from app.database import get_sessionmaker
from app.models.driver import Driver
from app.models.enums import TripStatus, UserRole, VehicleStatus
from app.models.expense import Expense
from app.models.fuel_log import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.trip import Trip
from app.models.user import User
from app.models.vehicle import Vehicle


async def seed() -> None:
    async with get_sessionmaker()() as db:
        existing = await db.scalar(select(User).where(User.email == "manager@transitops.io"))
        if existing:
            return
        manager = User(name="Morgan Fleet", email="manager@transitops.io", password_hash=hash_password("TransitOps123"), role=UserRole.fleet_manager)
        analyst = User(name="Finley Cost", email="analyst@transitops.io", password_hash=hash_password("TransitOps123"), role=UserRole.financial_analyst)
        db.add_all([manager, analyst])
        vehicles = [
            Vehicle(reg_number="VAN-05", name="Van-05", type="Van", region="North", max_load_kg=Decimal("600"), odometer=21000, acquisition_cost=42000),
            Vehicle(reg_number="TRK-11", name="Truck-11", type="Truck", region="North", max_load_kg=Decimal("1800"), odometer=64000, acquisition_cost=86000),
            Vehicle(reg_number="VAN-09", name="Van-09", type="Van", region="South", max_load_kg=Decimal("700"), odometer=19000, acquisition_cost=43000),
            Vehicle(reg_number="BUS-02", name="Bus-02", type="Bus", region="North", max_load_kg=Decimal("1200"), odometer=78000, acquisition_cost=98000, status=VehicleStatus.in_shop),
            Vehicle(reg_number="VAN-12", name="Van-12", type="Van", region="East", max_load_kg=Decimal("800"), odometer=14000, acquisition_cost=45000, status=VehicleStatus.in_shop),
            Vehicle(reg_number="TRK-15", name="Truck-15", type="Truck", region="South", max_load_kg=Decimal("2000"), odometer=34000, acquisition_cost=92000),
        ]
        drivers = [
            Driver(name="Alex Rivera", license_number="ALX-2045", license_category="B", license_expiry=date.today() + timedelta(days=420), safety_score=Decimal("96")),
            Driver(name="Priya Shah", license_number="PRI-1290", license_category="C", license_expiry=date.today() + timedelta(days=4), safety_score=Decimal("88")),
            Driver(name="Noah Chen", license_number="NOA-7744", license_category="B", license_expiry=date.today() + timedelta(days=80), safety_score=Decimal("74")),
        ]
        db.add_all(vehicles + drivers)
        await db.flush()
        now = datetime.now(timezone.utc)
        completed = [
            Trip(source="North DC", destination="Market Hub", vehicle_id=vehicles[0].id, driver_id=drivers[0].id, cargo_weight=450, planned_distance=120, actual_distance=118, fuel_consumed=14, status=TripStatus.completed, completed_at=now - timedelta(days=18)),
            Trip(source="Depot 3", destination="Airport", vehicle_id=vehicles[1].id, driver_id=drivers[1].id, cargo_weight=900, planned_distance=210, actual_distance=220, fuel_consumed=38, status=TripStatus.completed, completed_at=now - timedelta(days=1)),
            Trip(source="South DC", destination="Clinic Route", vehicle_id=vehicles[2].id, driver_id=drivers[2].id, cargo_weight=350, planned_distance=90, actual_distance=92, fuel_consumed=16, status=TripStatus.completed, completed_at=now - timedelta(days=6)),
            Trip(source="North DC", destination="Retail Loop", cargo_weight=450, planned_distance=125, status=TripStatus.draft),
            Trip(source="East DC", destination="Central Station", vehicle_id=vehicles[5].id, driver_id=drivers[2].id, cargo_weight=1100, planned_distance=85, status=TripStatus.cancelled),
        ]
        db.add_all(completed)
        db.add_all([
            MaintenanceLog(vehicle_id=vehicles[3].id, description="Brake inspection overdue", cost=Decimal("620")),
            MaintenanceLog(vehicle_id=vehicles[4].id, description="Transmission replacement", cost=Decimal("1500")),
        ])
        db.add_all([
            FuelLog(vehicle_id=vehicles[0].id, liters=Decimal("42"), cost=Decimal("168"), date=date.today() - timedelta(days=6), odometer_at_fill=Decimal("21120")),
            Expense(vehicle_id=vehicles[0].id, type="toll", amount=Decimal("45"), date=date.today() - timedelta(days=4), notes="North express corridor"),
        ])
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
