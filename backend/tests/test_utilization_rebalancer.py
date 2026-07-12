import asyncio
from datetime import date, timedelta
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from app.services.utilization_rebalancer import get_rebalance_suggestions


def test_get_rebalance_suggestions_returns_idle_vehicle_match(monkeypatch):
    vehicle = SimpleNamespace(id=uuid4(), reg_number="VAN-08", region="North", max_load_kg=Decimal("700"))
    trip = SimpleNamespace(id=uuid4(), cargo_weight=Decimal("450"))
    driver = SimpleNamespace(id=uuid4(), safety_score=Decimal("95"), license_expiry=date.today() + timedelta(days=90))

    class Result:
        def __init__(self, rows):
            self.rows = rows

        def scalars(self):
            return self

        def all(self):
            return self.rows

    class Db:
        calls = 0

        async def execute(self, stmt):
            self.calls += 1
            return Result([vehicle] if self.calls == 1 else [trip])

    async def health(vehicle, db):
        return {"flags": ["Underutilized"]}

    async def idle_days(vehicle, db):
        return 9

    async def drivers(trip, db):
        return [driver]

    async def score(vehicle, driver, cargo_weight, db):
        return 91.0, ["Good capacity match"]

    monkeypatch.setattr("app.services.utilization_rebalancer.compute_health", health)
    monkeypatch.setattr("app.services.utilization_rebalancer.get_idle_days", idle_days)
    monkeypatch.setattr("app.services.utilization_rebalancer.get_eligible_drivers_for_trip", drivers)
    monkeypatch.setattr("app.services.utilization_rebalancer.compute_fit_score", score)

    suggestions = asyncio.run(get_rebalance_suggestions(Db()))

    assert suggestions
    assert suggestions[0]["vehicle_id"] == vehicle.id
    assert suggestions[0]["trip_id"] == trip.id
    assert suggestions[0]["score"] == 91.0
