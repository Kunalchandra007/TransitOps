import asyncio
from decimal import Decimal
from types import SimpleNamespace

from app.models.enums import VehicleStatus
from app.services.fleet_health import get_status_wall_data


def test_get_status_wall_data_places_dispatched_vehicle_on_trip():
    vehicle = SimpleNamespace(id="v1", reg_number="VAN-05", type="Van", status=VehicleStatus.on_trip)
    driver = SimpleNamespace(name="Alex Rivera")
    trip = SimpleNamespace(driver_id="d1", destination="Market Hub", planned_distance=Decimal("120"), dispatched_at=None)

    class Result:
        def scalars(self):
            return self

        def all(self):
            return [vehicle]

    class Db:
        async def execute(self, stmt):
            return Result()

        async def scalar(self, stmt):
            return trip

        async def get(self, model, key):
            return driver

    grouped = asyncio.run(get_status_wall_data(Db()))

    assert grouped["On Trip"][0]["current_driver_name"] == "Alex Rivera"
    assert grouped["On Trip"][0]["current_trip"]["destination"] == "Market Hub"
