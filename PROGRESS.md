# TransitOps Progress

## Current Status

TransitOps has a working full-stack foundation in place. The project includes a FastAPI backend, PostgreSQL schema/migration, seed data, Docker Compose orchestration, and a React/Vite frontend that covers the main operational workflows.

Phase 9, Predictive Conflict Radar, is complete. The dashboard now surfaces upcoming operational conflicts and can request dispatch-score based suggestions for resolving driver or vehicle assignment risks.

Phase 10 is also complete. TransitOps now has advisory fuel expense anomaly detection, utilization rebalance suggestions, and a live fleet status wall.

## Completed

- Project structure scaffolded for backend, frontend, Docker, migrations, services, routers, schemas, and tests.
- Docker Compose added for:
  - PostgreSQL 15
  - FastAPI backend
  - React/Vite frontend
- Docker run quality fixes added:
  - `backend/.dockerignore`
  - `frontend/.dockerignore`
  - Valid demo login domain: `manager@transitops.io`
  - PostgreSQL enum migration/model persistence fixes
- Backend implemented with:
  - Async SQLAlchemy models
  - Pydantic v2 schemas
  - JWT authentication
  - bcrypt password hashing through Passlib
  - RBAC route dependency
  - Alembic initial migration
  - Seed script with demo vehicles, drivers, trips, maintenance, fuel, and expense data
- Core business services implemented:
  - Trip dispatch, completion, and cancellation
  - Smart Dispatch Score engine
  - Predictive Conflict Radar scan and suggestions
  - Expense anomaly detection
  - Utilization rebalancing suggestions
  - Maintenance open/close status changes
  - Fleet health calculation
  - Live fleet status wall data
  - Cost, fuel efficiency, and ROI helpers
- API routers implemented for:
  - Auth
  - Vehicles
  - Drivers
  - Trips
  - Maintenance
  - Fuel logs
  - Expenses
  - Dashboard
  - Conflict Radar
  - Rebalance Suggestions
  - Status Wall
  - Reports
- Frontend implemented with:
  - Login page
  - Dashboard
  - Predictive Conflict Radar panel
  - Utilization Rebalancer panel
  - Live Fleet Status Wall page
  - Vehicle registry
  - Driver management
  - Trip management
  - Smart dispatch flow
  - Maintenance page
  - Fuel and expense entry
  - Reports page
- Validation completed:
  - Frontend production build passed with `npm run build`.
  - FastAPI app import passed.
  - Dispatch score test logic passed through direct Python invocation.
  - Conflict radar test logic passed through direct Python invocation.
  - Expense anomaly, utilization rebalancer, and status wall test logic passed through direct Python invocation.

## Phase 9: Predictive Conflict Radar

### Completed Scope

- Added read-only backend radar service at `backend/app/services/conflict_radar.py`.
- Added conflict response schemas:
  - `ConflictSeverity`
  - `ConflictItem`
- Added dashboard endpoints:
  - `GET /dashboard/conflict-radar?horizon_days=7`
  - `GET /dashboard/conflict-radar/{conflict_index}/suggestions?horizon_days=7`
- Added optional exclusion support to `get_ranked_pairs(...)`:
  - `exclude_driver_id`
  - `exclude_vehicle_id`
- Added frontend panel at `frontend/src/components/ConflictRadarPanel.tsx`.
- Mounted the radar panel at the top of `Dashboard.tsx`, above KPI cards.
- Added `backend/tests/test_conflict_radar.py`.
- Updated `ARCHITECTURE.md` and this progress document.

### Conflict Checks

The radar currently checks:

- License expiry: drivers whose licenses expire within the selected horizon and who still have draft or dispatched trips.
- Maintenance due: vehicles near the next odometer service interval and already assigned to active/planned trips.
- Regional shortage: active/planned trip demand by region compared with available vehicle and driver capacity.

### Suggestion Behavior

The suggestions endpoint is stateless. It rescans conflicts for the requested horizon, selects the conflict by index, and then reuses the dispatch score engine to return alternate ranked vehicle/driver pairs.

For driver conflicts, suggestions exclude the risky driver.

For vehicle conflicts, suggestions exclude the risky vehicle.

For region-level capacity shortage conflicts, suggestions currently return an empty list because there is no single trip assignment to repair.

## Phase 10: Expense Anomaly Detector, Utilization Rebalancer, Status Wall

### Completed Scope

- Added advisory fuel anomaly detection to `backend/app/services/cost_engine.py`.
- Modified `POST /fuel-logs` to return:
  - `fuel_log`
  - `anomaly_flags`
- Added `FuelLogCreateResponse` schema.
- Added frontend warning banner in `FuelExpense.tsx` for non-blocking anomaly alerts.
- Added `backend/app/services/utilization_rebalancer.py`.
- Added `GET /dashboard/rebalance-suggestions`.
- Added `RebalanceSuggestion` schema.
- Added `frontend/src/components/RebalancePanel.tsx`.
- Mounted the rebalancer panel below Conflict Radar on the dashboard.
- Added status wall helper in `fleet_health.py`.
- Added `GET /dashboard/status-wall`.
- Added `StatusWallVehicle` and `StatusWallTrip` schemas.
- Added `frontend/src/pages/StatusWall.tsx`.
- Added Status Wall navigation in `router.tsx`.
- Added tests:
  - `backend/tests/test_cost_anomaly.py`
  - `backend/tests/test_utilization_rebalancer.py`
  - `backend/tests/test_status_wall.py`

### Expense Anomaly Checks

Fuel log saves are never blocked. After a fuel log is saved, the backend checks:

- Cost per liter compared with fleet average for that vehicle type.
- Liters filled compared with expected usage since the previous fill.
- Possible duplicate entry with the same vehicle, date, and amount.

The frontend displays anomaly flags as a dismissible warning banner.

### Utilization Rebalancer Flow

The rebalancer scans available vehicles marked `Underutilized` by fleet health, finds matching draft trips in the same region, then reuses dispatch scoring to find a strong driver/vehicle/trip match.

The dashboard card shows the suggested vehicle, idle days, trip, score, and reasons. The `Assign` button navigates to the existing Smart Dispatch page with the trip, vehicle, and driver prefilled through query parameters.

### Status Wall Flow

The status wall groups vehicles by:

- `Available`
- `On Trip`
- `In Shop`

On-trip cards show current driver, destination, planned distance, and a simple ETA estimate.

## Known Notes

- `pytest` prints a passing test result but hangs during runner shutdown in this local shell environment. The scoring test itself passes when invoked directly.
- The frontend build emits a Vite chunk-size warning because charting/router dependencies create a larger bundle. This is not a build failure.
- `node_modules`, `dist`, `.venv`, cache files, and env files are ignored through `.gitignore`.
- Docker build contexts now ignore generated dependency/build folders through service-level `.dockerignore` files.
- The running demo manager account is `manager@transitops.io`. The older `.test` demo email should not be used because the email validator rejects reserved domains.
- Passlib may print a trapped bcrypt version warning during seed/login in this environment. It does not prevent account creation or login.

## Project Flow

### 1. Local Development Startup

Start all services:

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

Full command reference lives in `RUNNING.md`.

Open the frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### 2. Login Flow

Seeded fleet manager:

```text
manager@transitops.io
TransitOps123
```

The frontend stores the JWT access token in local storage and attaches it to API requests through the Axios interceptor.

### 3. Vehicle And Driver Setup

Fleet managers can create vehicles and drivers from the registry pages. Vehicle and driver status fields are intentionally not editable from the frontend or general PATCH routes.

Status changes happen through backend service functions only.

### 4. Smart Dispatch Flow

The dispatch page creates a draft trip, asks the backend for eligible vehicle/driver pairs, then renders ranked dispatch cards.

The backend filters eligibility by:

- Vehicle availability
- Driver availability
- Driver license validity
- Vehicle cargo capacity
- Optional region match

The selected pair is dispatched through:

```text
POST /trips/{id}/dispatch
```

This changes the trip, vehicle, and driver statuses together.

### 5. Trip Completion Or Cancellation

Trips move from `Draft` to `Dispatched`, then to either `Completed` or `Cancelled`.

Completion records actual distance and fuel consumed. Completion and cancellation both release the vehicle and driver back to `Available`.

### 6. Maintenance Flow

Opening a maintenance log moves the vehicle to `In Shop`.

Closing the maintenance log moves the vehicle back to `Available`, unless the vehicle has been retired.

### 7. Dashboard And Conflict Radar Flow

The dashboard reads backend KPI, fleet-health, and conflict-radar endpoints:

- Active vehicles
- Available vehicles
- Vehicles in maintenance
- Active trips
- Pending trips
- Drivers on duty
- Utilization percentage
- Per-vehicle health colors and flags
- Predictive license, maintenance, and regional capacity conflicts
- Dispatch-score based suggestions for fixable conflicts

Conflict radar flow:

1. `ConflictRadarPanel` loads `/dashboard/conflict-radar` on mount.
2. Conflicts are returned sorted by severity.
3. Cards render with severity styling.
4. The user clicks `Suggest Fix`.
5. The frontend calls `/dashboard/conflict-radar/{conflict_index}/suggestions`.
6. Suggested assignments render through the existing `DispatchScoreCard` component.

### 8. Reporting Flow

Reports expose utilization, operational cost, fuel efficiency, ROI, and CSV export endpoints. The current frontend shows utilization and total operational cost as a first reporting pass.

### 9. Fuel Expense Flow

Fuel entries are saved normally. If the backend detects suspicious cost or quantity patterns, the response includes `anomaly_flags`, and the frontend shows a warning banner without blocking the saved entry.

### 10. Status Wall Flow

The Status Wall page reads `/dashboard/status-wall` and presents operational cards grouped by vehicle status. It is read-only and uses the same existing vehicle, trip, and driver data as the rest of the dashboard.

## Suggested Next Work

- Add full trip complete/cancel controls to the frontend trip table.
- Add integration tests for route behavior with a test database.
- Add Docker startup commands or entrypoint scripts for automatic migration/seed in development.
- Add frontend form validation and error toasts.
- Add role-aware navigation visibility.
- Add report filters for date range and vehicle selection.
- Add stronger test coverage for every dispatch guard clause from the original spec.
- Add richer map coordinates/GPS integration for the Status Wall when live telematics data exists.
