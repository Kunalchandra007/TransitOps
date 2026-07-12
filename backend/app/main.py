from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, dashboard, drivers, fuel_expense, maintenance, reports, trips, vehicles

settings = get_settings()
app = FastAPI(title="TransitOps API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(fuel_expense.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
