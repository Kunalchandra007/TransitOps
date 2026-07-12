# TransitOps Architecture

## Overview

TransitOps is a full-stack fleet operations platform.

The frontend is a React/Vite TypeScript application. It talks to a FastAPI backend through Axios. The backend uses async SQLAlchemy models, Pydantic schemas, JWT authentication, RBAC dependencies, and PostgreSQL persistence. Alembic owns database migrations.

The most important architectural rule is that vehicle and driver operational statuses are not directly controlled by the frontend. Status changes are centralized in backend service modules.

Predictive Conflict Radar is a read-only planning layer. It scans existing drivers, vehicles, and trips for upcoming operational risk, then reuses the Smart Dispatch Score engine to suggest alternate assignments where possible.

Phase 10 adds three advisory/read-only intelligence surfaces: fuel expense anomaly detection, utilization rebalancing suggestions, and a live fleet status wall.

## System Diagram

```text
React/Vite Frontend
    |
    | Axios + JWT Bearer token
    v
FastAPI Backend
    |
    | Routers call services
    v
Business Services
    |
    | Async SQLAlchemy
    v
PostgreSQL
```

## Phase 9: Predictive Conflict Radar

Conflict Radar adds a planning intelligence layer without adding tables or changing the schema.

### Radar Data Flow

```text
Dashboard.tsx
    |
    v
ConflictRadarPanel.tsx
    |
    | GET /dashboard/conflict-radar
    v
dashboard.py router
    |
    v
conflict_radar.scan_upcoming_conflicts()
    |
    | reads drivers, vehicles, trips
    v
PostgreSQL

Suggest Fix
    |
    | GET /dashboard/conflict-radar/{index}/suggestions
    v
conflict_radar.suggest_resolution()
    |
    | calls dispatch_score.get_ranked_pairs(...)
    v
RankedPair[]
```

### Radar Checks

- `license_expiry`: driver license expires inside the horizon and the driver has draft or dispatched trips.
- `maintenance_due`: vehicle odometer is close to the next service interval and the vehicle has draft or dispatched trips.
- `capacity_shortage`: regional active/planned trip demand exceeds available vehicle/driver capacity.

### Radar Suggestions

Suggestions reuse `dispatch_score.get_ranked_pairs(...)` rather than introducing a second scoring system.

- Driver conflict: excludes the at-risk driver.
- Vehicle conflict: excludes the at-risk vehicle.
- Region conflict: returns no suggestions for now because there is no single affected assignment.

The suggestions endpoint is stateless: it rescans conflicts and uses `conflict_index` to select the current conflict.

## Backend Architecture

### Layers

- `routers/`: HTTP endpoints, request validation, RBAC wiring, and response models.
- `schemas/`: Pydantic request and response contracts.
- `models/`: SQLAlchemy ORM models and enums.
- `services/`: Business logic, especially status transitions and calculations.
- `auth/`: JWT, password hashing, current-user dependency, and RBAC guards.
- `database.py`: Async SQLAlchemy engine/session setup.
- `config.py`: Environment-driven settings.
- `alembic/`: Database migration environment and versioned schema.

### Status Mutation Rule

Vehicle and driver statuses must only be changed by backend service functions.

Primary status-changing services:

- `trip_service.py`
  - Dispatches trips
  - Completes trips
  - Cancels trips
  - Updates trip, vehicle, and driver together
- `maintenance_service.py`
  - Opens maintenance logs
  - Closes maintenance logs
  - Updates vehicle shop availability

Vehicle and driver PATCH routes reject payloads containing `status`.

## Phase 10: Operational Intelligence

Phase 10 does not add tables or migrations. It evaluates and reshapes existing data.

### Expense Anomaly Detector

```text
FuelExpense.tsx
    |
    | POST /fuel-logs
    v
fuel_expense.py
    |
    | saves FuelLog
    v
cost_engine.check_fuel_anomaly()
    |
    | returns advisory flags
    v
FuelLogCreateResponse
```

Anomaly checks are advisory. They never block a saved fuel log.

Checks include:

- Cost per liter above fleet average.
- Liters filled far above expected usage since last fill.
- Possible duplicate entry.

### Utilization Rebalancer

```text
Dashboard.tsx
    |
    v
RebalancePanel.tsx
    |
    | GET /dashboard/rebalance-suggestions
    v
utilization_rebalancer.get_rebalance_suggestions()
    |
    | uses fleet_health + dispatch_score
    v
RebalanceSuggestion[]
```

The rebalancer looks for underutilized available vehicles, matching draft trips, and eligible drivers. Suggestions navigate into the existing Smart Dispatch flow instead of adding another assignment API.

### Live Fleet Status Wall

```text
StatusWall.tsx
    |
    | GET /dashboard/status-wall
    v
fleet_health.get_status_wall_data()
    |
    | reads vehicles, dispatched trips, drivers
    v
Grouped vehicle status cards
```

The status wall groups vehicles by status and enriches on-trip vehicles with driver, destination, planned distance, and ETA estimate.

## Frontend Architecture

### Layers

- `api/`: Axios client and resource-specific API helpers.
- `context/`: Auth state and login/logout behavior.
- `components/`: Reusable UI components.
- `pages/`: Route-level screens.
- `router.tsx`: Application routes and authenticated layout.
- `styles.css`: Tailwind base and shared utility classes.

### Frontend Flow

The user signs in, receives a JWT, and then navigates through operational pages. The frontend submits commands to the backend but does not make trusted eligibility or status decisions locally.

The Smart Dispatch page is the centerpiece:

1. Create a draft trip.
2. Request eligible ranked assignments from the backend.
3. Display dispatch score cards.
4. Dispatch the selected vehicle/driver pair.

The dashboard now includes Conflict Radar as the first panel and Utilization Rebalancer below it. Conflict Radar loads predictive conflicts on mount and renders suggestion results with the existing `DispatchScoreCard` component. Rebalance suggestions route the user into Smart Dispatch with prefilled trip, vehicle, and driver query parameters.

## File Map

### Root

| File | Purpose |
|---|---|
| `.gitignore` | Ignores generated files such as virtual environments, `node_modules`, build output, caches, bytecode, and env files. |
| `docker-compose.yml` | Defines Postgres, backend, and frontend development services. |
| `README.md` | Main project overview, quick start, feature summary, and documentation links. |
| `RUNNING.md` | Local runbook with Docker/manual commands, migrations, seed, health checks, and troubleshooting. |
| `PROGRESS.md` | Tracks current build status, project flow, validation notes, and next work. |
| `ARCHITECTURE.md` | Documents project architecture and file responsibilities. |

### Backend Root

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Builds the FastAPI backend container. |
| `backend/.dockerignore` | Keeps `.venv`, caches, bytecode, and env files out of Docker build context. |
| `backend/requirements.txt` | Python dependency list for the backend. |
| `backend/alembic.ini` | Alembic configuration. |
| `backend/pytest.ini` | Pytest configuration, including backend import path. |

### Backend App Core

| File | Purpose |
|---|---|
| `backend/app/main.py` | Creates the FastAPI app, configures CORS, registers routers, and exposes `/health`. |
| `backend/app/config.py` | Defines application settings loaded from environment variables or `.env`. |
| `backend/app/database.py` | Provides lazy async SQLAlchemy engine and session creation plus the `Base` model class. |
| `backend/app/seed.py` | Seeds demo users, vehicles, drivers, trips, maintenance, fuel logs, and expenses. |

### Backend Auth

| File | Purpose |
|---|---|
| `backend/app/auth/jwt_handler.py` | Handles password hashing, password verification, JWT creation, and current-user loading. |
| `backend/app/auth/rbac.py` | Defines `require_role(...)` dependency for role-based route protection. |

### Backend Models

| File | Purpose |
|---|---|
| `backend/app/models/__init__.py` | Imports model classes for convenient package-level access. |
| `backend/app/models/enums.py` | Defines user role and status enums. |
| `backend/app/models/user.py` | SQLAlchemy model for platform users. |
| `backend/app/models/vehicle.py` | SQLAlchemy model for vehicles, including load capacity, region, cost, odometer, and status. |
| `backend/app/models/driver.py` | SQLAlchemy model for drivers, license metadata, safety score, and status. |
| `backend/app/models/trip.py` | SQLAlchemy model for trips, assignment, distance/fuel data, status, and timestamps. |
| `backend/app/models/maintenance.py` | SQLAlchemy model for vehicle maintenance logs. |
| `backend/app/models/fuel_log.py` | SQLAlchemy model for fuel purchases. |
| `backend/app/models/expense.py` | SQLAlchemy model for tolls, fines, and other vehicle expenses. |

### Backend Schemas

| File | Purpose |
|---|---|
| `backend/app/schemas/__init__.py` | Re-exports schema classes. |
| `backend/app/schemas/common.py` | Contains Pydantic request/response models for auth, vehicles, drivers, trips, maintenance, fuel logs, expenses, ranked dispatch pairs, conflict radar items, rebalance suggestions, and status wall vehicles. |

### Backend Routers

| File | Purpose |
|---|---|
| `backend/app/routers/__init__.py` | Marks the routers directory as a package. |
| `backend/app/routers/auth.py` | Implements signup, login, and current-user endpoints. |
| `backend/app/routers/vehicles.py` | Implements vehicle list/create/get/update/retire endpoints and blocks direct status edits. |
| `backend/app/routers/drivers.py` | Implements driver list/create/get/update endpoints and blocks direct status edits. |
| `backend/app/routers/trips.py` | Implements trip list/create/get, eligibility, dispatch, complete, and cancel endpoints. |
| `backend/app/routers/maintenance.py` | Implements maintenance list/open/close endpoints. |
| `backend/app/routers/fuel_expense.py` | Implements fuel-log and expense create/list endpoints, including advisory fuel anomaly response flags. |
| `backend/app/routers/dashboard.py` | Implements KPI, fleet-health, conflict radar, rebalance suggestion, and status wall dashboard endpoints. |
| `backend/app/routers/reports.py` | Implements fuel efficiency, utilization, operational cost, ROI, and CSV export endpoints. |

Dashboard routes include:

- `GET /dashboard/kpis`
- `GET /dashboard/fleet-health`
- `GET /dashboard/conflict-radar?horizon_days=7`
- `GET /dashboard/conflict-radar/{conflict_index}/suggestions?horizon_days=7`
- `GET /dashboard/rebalance-suggestions`
- `GET /dashboard/status-wall`

Conflict radar response shape:

```json
{
  "type": "license_expiry",
  "severity": "high",
  "message": "Alex Rivera's license expires 2026-07-14, but has 1 upcoming trip(s)",
  "entity_id": "uuid-or-null",
  "entity_type": "driver",
  "affected_trip_ids": ["trip-uuid"],
  "region": null
}
```

Conflict suggestion response shape matches the existing ranked dispatch pair response:

```json
[
  {
    "vehicle": "...VehicleRead",
    "driver": "...DriverRead",
    "score": 91.4,
    "reasons": ["Good capacity match", "High safety score"]
  }
]
```

Fuel log create response shape:

```json
{
  "fuel_log": "...FuelLogRead",
  "anomaly_flags": [
    "Cost/liter (8.00) is 40%+ above fleet average (4.00)"
  ]
}
```

Rebalance suggestion response shape:

```json
{
  "vehicle_id": "vehicle-uuid",
  "vehicle_reg": "VAN-08",
  "trip_id": "trip-uuid",
  "driver_id": "driver-uuid",
  "score": 91.0,
  "reasons": ["Good capacity match"],
  "idle_days": 9
}
```

Status wall response shape:

```json
{
  "Available": [],
  "On Trip": [
    {
      "reg_number": "VAN-05",
      "type": "Van",
      "status": "On Trip",
      "current_driver_name": "Alex Rivera",
      "current_trip": {
        "destination": "Market Hub",
        "planned_distance": 120
      },
      "eta_estimate": "2.1h remaining"
    }
  ],
  "In Shop": []
}
```

### Backend Services

| File | Purpose |
|---|---|
| `backend/app/services/trip_service.py` | Owns trip dispatch, completion, and cancellation status transitions. |
| `backend/app/services/maintenance_service.py` | Owns maintenance open/close status transitions. |
| `backend/app/services/dispatch_score.py` | Computes dispatch fit scores and ranked vehicle/driver pairs. |
| `backend/app/services/conflict_radar.py` | Scans upcoming license, maintenance, and regional capacity conflicts, then suggests alternate ranked assignments. |
| `backend/app/services/fleet_health.py` | Computes per-vehicle green/yellow/red health status and flags, and builds status wall data. |
| `backend/app/services/utilization_rebalancer.py` | Finds underutilized vehicles that can be paired with draft trips and eligible drivers. |
| `backend/app/services/cost_engine.py` | Computes operational cost, fuel efficiency, ROI, and fuel anomaly flags. |

### Backend Migrations And Tests

| File | Purpose |
|---|---|
| `backend/alembic/env.py` | Alembic runtime environment for async SQLAlchemy migrations. |
| `backend/alembic/versions/0001_initial.py` | Initial PostgreSQL schema migration, including enums, tables, constraints, and indexes. |
| `backend/tests/test_dispatch_score.py` | Unit test for dispatch score calculation behavior. |
| `backend/tests/test_conflict_radar.py` | Unit test for detecting an expiring driver license conflict with an upcoming trip. |
| `backend/tests/test_cost_anomaly.py` | Unit test for advisory high fuel cost anomaly detection. |
| `backend/tests/test_utilization_rebalancer.py` | Unit test for returning an idle vehicle rebalance suggestion. |
| `backend/tests/test_status_wall.py` | Unit test for placing a dispatched vehicle in the On Trip status wall group. |

### Frontend Root

| File | Purpose |
|---|---|
| `frontend/Dockerfile` | Builds the Vite frontend container. |
| `frontend/.dockerignore` | Keeps `node_modules`, `dist`, env files, and logs out of Docker build context. |
| `frontend/package.json` | Frontend dependencies and npm scripts. |
| `frontend/package-lock.json` | Locked npm dependency versions. |
| `frontend/index.html` | Vite HTML entry point. |
| `frontend/tsconfig.json` | TypeScript compiler configuration. |
| `frontend/vite.config.ts` | Vite configuration. |
| `frontend/postcss.config.js` | PostCSS configuration for Tailwind. |
| `frontend/tailwind.config.js` | Tailwind content paths and theme extensions. |

### Frontend Source

| File | Purpose |
|---|---|
| `frontend/src/main.tsx` | React application entry point. |
| `frontend/src/router.tsx` | Defines authenticated layout, navigation, and route mapping. |
| `frontend/src/styles.css` | Tailwind imports and shared CSS utilities. |
| `frontend/src/vite-env.d.ts` | Vite TypeScript environment declarations. |

### Frontend API

| File | Purpose |
|---|---|
| `frontend/src/api/client.ts` | Axios instance, JWT request interceptor, and shared TypeScript API types. |
| `frontend/src/api/resources.ts` | Resource-specific API helpers for auth, vehicles, drivers, trips, maintenance, fuel/expense, dashboard, and reports. |

### Frontend Context

| File | Purpose |
|---|---|
| `frontend/src/context/AuthContext.tsx` | Stores auth token/role, handles login/logout, and exposes auth state to the app. |

### Frontend Components

| File | Purpose |
|---|---|
| `frontend/src/components/StatusBadge.tsx` | Displays status labels with consistent color treatment. |
| `frontend/src/components/KpiCard.tsx` | Displays dashboard KPI values with icons. |
| `frontend/src/components/DataTable.tsx` | Generic table component for registry/report style data. |
| `frontend/src/components/ConflictRadarPanel.tsx` | Displays predictive conflicts and fetches ranked dispatch-score suggestions for fixes. |
| `frontend/src/components/RebalancePanel.tsx` | Displays underutilized vehicle suggestions and navigates assignments into Smart Dispatch. |
| `frontend/src/components/FleetHealthGrid.tsx` | Displays vehicle health cards. |
| `frontend/src/components/DispatchScoreCard.tsx` | Displays ranked dispatch assignment cards with score and reasons. |

### Frontend Pages

| File | Purpose |
|---|---|
| `frontend/src/pages/Login.tsx` | Sign-in page with seeded demo credentials. |
| `frontend/src/pages/Dashboard.tsx` | KPI, chart, and fleet-health overview. |
| `frontend/src/pages/VehicleRegistry.tsx` | Vehicle list and create form. |
| `frontend/src/pages/DriverManagement.tsx` | Driver list and create form. |
| `frontend/src/pages/TripManagement.tsx` | Trip table and status overview. |
| `frontend/src/pages/TripCreate.tsx` | Smart Dispatch workflow for draft creation, scoring, and dispatch. |
| `frontend/src/pages/StatusWall.tsx` | Read-only live fleet status wall grouped by vehicle status. |
| `frontend/src/pages/Maintenance.tsx` | Maintenance log open/close workflow. |
| `frontend/src/pages/FuelExpense.tsx` | Fuel log and expense entry forms. |
| `frontend/src/pages/Reports.tsx` | Operational cost and utilization report display. |

## Data Model Summary

Core entities:

- `users`: Authentication and role ownership.
- `vehicles`: Fleet assets.
- `drivers`: Driver records and safety scores.
- `trips`: Planned and executed trips.
- `maintenance_logs`: Vehicle maintenance events.
- `fuel_logs`: Fuel purchases.
- `expenses`: Other vehicle operating costs.

Important indexes:

- `vehicles.status`
- `drivers.status`
- `trips.status`
- `trips.vehicle_id`
- `trips.driver_id`

These support eligibility filtering and dashboard queries.

Conflict Radar uses existing fields only:

- `drivers.license_expiry`
- `drivers.status`
- `vehicles.odometer`
- `vehicles.region`
- `vehicles.status`
- `trips.status`
- `trips.driver_id`
- `trips.vehicle_id`
- `trips.cargo_weight`

No new tables or migrations are required for Phase 9.

Phase 10 also uses existing fields only:

- `fuel_logs.vehicle_id`
- `fuel_logs.liters`
- `fuel_logs.cost`
- `fuel_logs.date`
- `vehicles.type`
- `vehicles.odometer`
- `vehicles.region`
- `vehicles.status`
- `drivers.license_expiry`
- `drivers.status`
- `trips.status`
- `trips.destination`
- `trips.planned_distance`
- `trips.dispatched_at`

No new tables or migrations are required for Phase 10.

## RBAC Summary

RBAC is implemented with `require_role(...)`.

Current route protection follows the intended split:

- Fleet manager: core management and reporting access.
- Driver: trip creation/dispatch and fuel/expense entry.
- Safety officer: driver management and report visibility.
- Financial analyst: report visibility.

## Operational Guarantees

- The frontend does not directly set vehicle or driver status.
- Vehicle and driver PATCH routes reject `status` in the request body.
- SQLAlchemy enum models persist the human-readable PostgreSQL enum values such as `Available`, not Python enum member names such as `available`.
- Dispatch eligibility is calculated server-side.
- Dispatch score ranking is calculated server-side.
- Maintenance and trip transitions are centralized in services.
- Conflict Radar is read-only and does not mutate trip, vehicle, or driver status.
- Conflict fix suggestions reuse the dispatch score service instead of creating parallel assignment logic.
- Expense anomaly checks are advisory and never block a fuel or expense save.
- Utilization rebalancer suggestions do not assign directly; they route the user into Smart Dispatch.
- Status Wall is read-only and does not mutate operational state.
