import asyncio
from datetime import date, timedelta
from types import SimpleNamespace
from uuid import uuid4

from app.services.conflict_radar import scan_upcoming_conflicts


def test_scan_upcoming_conflicts_detects_expiring_driver_license(monkeypatch):
    driver = SimpleNamespace(
        id=uuid4(),
        name="Alex Rivera",
        license_expiry=date.today() + timedelta(days=2),
    )
    trip = SimpleNamespace(id=uuid4())

    async def drivers_with_expiry_before(db, horizon):
        return [driver]

    async def trips_for_driver(db, driver_id, status__in):
        return [trip] if driver_id == driver.id else []

    async def vehicles_near_service_interval(db):
        return []

    async def regional_shortages(db, horizon):
        return {}

    monkeypatch.setattr("app.services.conflict_radar.get_drivers_with_expiry_before", drivers_with_expiry_before)
    monkeypatch.setattr("app.services.conflict_radar.get_trips_for_driver", trips_for_driver)
    monkeypatch.setattr("app.services.conflict_radar.get_vehicles_near_service_interval", vehicles_near_service_interval)
    monkeypatch.setattr("app.services.conflict_radar.get_regional_shortages", regional_shortages)

    conflicts = asyncio.run(scan_upcoming_conflicts(SimpleNamespace(), horizon_days=7))

    assert len(conflicts) == 1
    assert conflicts[0]["type"] == "license_expiry"
    assert conflicts[0]["severity"] == "high"
    assert conflicts[0]["entity_id"] == driver.id
    assert conflicts[0]["affected_trip_ids"] == [trip.id]
