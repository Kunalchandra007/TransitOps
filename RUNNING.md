# TransitOps Runbook

This file is the quick command sheet for running TransitOps locally.

## Current Local URLs

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs
Postgres: localhost:5432
```

Demo login:

```text
Email:    manager@transitops.io
Password: TransitOps123
```

## Recommended Startup: Docker Compose

Run from the project root:

```powershell
cd C:\Projects\TransitOps
docker compose up --build -d
```

Check containers:

```powershell
docker compose ps
```

Expected services:

```text
transitops-postgres-1
transitops-backend-1
transitops-frontend-1
```

## Database Setup

Run migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Seed demo data:

```powershell
docker compose exec backend python -m app.seed
```

If the seed says duplicate demo data already exists, the database already has part or all of the demo fleet. The app can still run.

## Create Demo Manager Manually

If login fails, create the manager account through the API:

```powershell
$body = @{
  name = 'Morgan Fleet'
  email = 'manager@transitops.io'
  password = 'TransitOps123'
  role = 'fleet_manager'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8000/auth/signup' -Method Post -ContentType 'application/json' -Body $body
```

Verify login:

```powershell
$body = @{
  email = 'manager@transitops.io'
  password = 'TransitOps123'
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:8000/auth/login' -Method Post -ContentType 'application/json' -Body $body
```

## Health Checks

Backend health:

```powershell
curl.exe http://localhost:8000/health
```

Container logs:

```powershell
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

Follow logs:

```powershell
docker compose logs -f backend
```

## Stop The App

Stop containers but keep database data:

```powershell
docker compose down
```

Stop containers and remove database data:

```powershell
docker compose down -v
```

After `docker compose down -v`, run migrations and seed again.

## Manual Non-Docker Mode

Manual mode still needs PostgreSQL running with a database matching `DATABASE_URL`.

Backend:

```powershell
cd C:\Projects\TransitOps\backend
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd C:\Projects\TransitOps\frontend
npm run dev
```

Manual migration:

```powershell
cd C:\Projects\TransitOps\backend
.\.venv\Scripts\python -m alembic upgrade head
.\.venv\Scripts\python -m app.seed
```

## Common Issues

### Docker Desktop Not Running

Start Docker Desktop first, then retry:

```powershell
docker compose up --build -d
```

### Docker Access Denied

Run the shell with permissions that can access Docker Desktop, or start Docker Desktop and retry from a terminal that can connect to the Docker engine.

### Migration Enum Errors

The migration has been adjusted so PostgreSQL enum types are created once and reused by table columns.

### Email Validation

Use:

```text
manager@transitops.io
```

Do not use the older `.test` demo email. The email validator rejects special-use/reserved domains.

### Slow Docker Builds

`.dockerignore` files exist in both `backend/` and `frontend/` so Docker does not upload `.venv`, `node_modules`, or `dist`. Rebuilds should now be much faster.
