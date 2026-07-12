# TransitOps

TransitOps is a full-stack fleet operations platform for managing vehicles, drivers, dispatch, maintenance, fuel/expense tracking, reporting, and operational intelligence.

The app is built as a practical operations dashboard rather than a landing page. The first screen after login is the working fleet dashboard.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Axios
- Backend: FastAPI, Python, async SQLAlchemy, Pydantic v2
- Database: PostgreSQL 15
- Auth: JWT access tokens and bcrypt password hashing
- Migrations: Alembic
- Local orchestration: Docker Compose

## Quick Start

Start everything:

```powershell
cd C:\Projects\TransitOps
docker compose up --build -d
```

Run migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Seed demo data:

```powershell
docker compose exec backend python -m app.seed
```

Open:

```text
http://localhost:5173
```

Login:

```text
manager@transitops.io
TransitOps123
```

More commands are in [RUNNING.md](RUNNING.md).

## Main Features

### Authentication And RBAC

TransitOps supports users with roles:

- Fleet manager
- Driver
- Safety officer
- Financial analyst

Protected backend routes use a `require_role(...)` dependency.

### Vehicle Registry

Fleet managers can create, view, update, and retire vehicles.

Vehicle status is not directly editable through normal update routes. It changes through operational services such as dispatch and maintenance.

### Driver Management

Drivers have license metadata, safety scores, contact information, and operational status.

Driver status is not directly editable through normal update routes.

### Smart Dispatch

Dispatch creates draft trips, ranks eligible vehicle/driver pairs, and dispatches the selected assignment.

Eligibility and scoring happen server-side. The backend checks:

- Vehicle availability
- Driver availability
- Driver license validity
- Cargo capacity
- Region match where applicable

The dispatch score considers:

- Capacity fit
- Driver safety score
- Vehicle fuel efficiency
- Idle/utilization balance

### Trip Lifecycle

Trips move through:

```text
Draft -> Dispatched -> Completed
Draft -> Dispatched -> Cancelled
```

Dispatch, completion, and cancellation are centralized in `trip_service.py`.

### Maintenance

Opening a maintenance log moves the vehicle to `In Shop`.

Closing the maintenance log moves the vehicle back to `Available`, unless it is retired.

### Fuel And Expense Tracking

Users can enter fuel logs and expenses. Fuel log creation returns advisory anomaly flags when suspicious cost or quantity patterns are detected.

Anomaly flags never block saving the fuel log.

### Dashboard

The dashboard includes:

- KPI cards
- Trip/maintenance load chart
- Fleet health grid
- Predictive Conflict Radar
- Utilization Rebalancer

### Predictive Conflict Radar

Conflict Radar scans upcoming operations for:

- Driver license expiry conflicts
- Vehicles due for maintenance with planned trips
- Regional capacity shortages

For driver and vehicle conflicts, it can suggest alternate ranked assignments using the dispatch score engine.

### Utilization Rebalancer

The rebalancer finds underutilized available vehicles and suggests draft trips where the vehicle and an eligible driver produce a strong dispatch score.

The Assign button routes into Smart Dispatch with the trip, vehicle, and driver prefilled.

### Live Fleet Status Wall

The Status Wall groups vehicles by:

- Available
- On Trip
- In Shop

On-trip cards show driver, destination, planned distance, and a simple ETA estimate.

### Reports

Reports include:

- Fuel efficiency
- Utilization
- Operational cost
- ROI
- CSV export

## Project Structure

```text
TransitOps/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed.py
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── ARCHITECTURE.md
├── PROGRESS.md
├── RUNNING.md
└── README.md
```

## Important Backend Services

- `trip_service.py`: dispatch, complete, cancel trip transitions
- `maintenance_service.py`: open/close maintenance transitions
- `dispatch_score.py`: Smart Dispatch scoring and ranked pairs
- `conflict_radar.py`: predictive conflict scanning and suggestions
- `cost_engine.py`: cost, ROI, fuel efficiency, fuel anomaly checks
- `fleet_health.py`: fleet health and status wall data
- `utilization_rebalancer.py`: underutilized vehicle suggestions

## Operational Rules

- The frontend does not directly set vehicle or driver status.
- Vehicle and driver update routes reject direct status edits.
- Dispatch eligibility is calculated server-side.
- Dispatch score ranking is calculated server-side.
- Conflict Radar is read-only.
- Expense anomaly detection is advisory and never blocks saving.
- Rebalancer suggestions do not assign directly; they route into Smart Dispatch.
- Status Wall is read-only.

## Docs

- [RUNNING.md](RUNNING.md): exact local run commands and troubleshooting
- [ARCHITECTURE.md](ARCHITECTURE.md): architecture, service map, route map, file responsibilities
- [PROGRESS.md](PROGRESS.md): build status, completed phases, known notes, next work
