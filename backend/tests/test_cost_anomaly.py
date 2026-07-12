import asyncio
from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from app.services.cost_engine import check_fuel_anomaly


def test_check_fuel_anomaly_flags_high_cost_per_liter(monkeypatch):
    vehicle_id = uuid4()

    async def fleet_avg(db, vehicle_type=None):
        return 4.0

    async def last_fill(vehicle_id, db):
        return None

    async def duplicate(vehicle_id, entry_date, cost, db):
        return False

    class Db:
        async def get(self, model, key):
            return SimpleNamespace(id=key, type="Van")

    monkeypatch.setattr("app.services.cost_engine.get_fleet_avg_cost_per_liter", fleet_avg)
    monkeypatch.setattr("app.services.cost_engine.get_last_fuel_log", last_fill)
    monkeypatch.setattr("app.services.cost_engine.is_duplicate_entry", duplicate)

    flags = asyncio.run(check_fuel_anomaly(vehicle_id, Decimal("20"), Decimal("160"), date.today(), Db()))

    assert flags
    assert "40%+ above fleet average" in flags[0]
