import asyncio
from app.database import get_engine, Base
import app.models.driver
import app.models.expense
import app.models.fuel_log
import app.models.maintenance
import app.models.trip
import app.models.user
import app.models.vehicle
from app.seed import seed

async def reset():
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables reset.")
    await seed()
    print("Database seeded.")

if __name__ == "__main__":
    asyncio.run(reset())
