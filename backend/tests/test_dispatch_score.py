import asyncio
from decimal import Decimal
from types import SimpleNamespace

from app.services.dispatch_score import compute_fit_score


def test_compute_fit_score_rewards_good_capacity_and_safety(monkeypatch):
    vehicle = SimpleNamespace(id="v1", max_load_kg=Decimal("600"))
    driver = SimpleNamespace(id="d1", safety_score=Decimal("96"))

    async def efficiency(*args):
        return 80.0

    async def idle(*args):
        return 90.0

    monkeypatch.setattr("app.services.dispatch_score.get_relative_efficiency_score", efficiency)
    monkeypatch.setattr("app.services.dispatch_score.get_idle_bonus", idle)
    score, reasons = asyncio.run(compute_fit_score(vehicle, driver, Decimal("450"), None))
    assert score == 93.3
    assert "Good capacity match" in reasons
    assert "High safety score" in reasons
