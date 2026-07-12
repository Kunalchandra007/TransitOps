"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    user_role = postgresql.ENUM("fleet_manager", "driver", "safety_officer", "financial_analyst", name="user_role")
    vehicle_status = postgresql.ENUM("Available", "On Trip", "In Shop", "Retired", name="vehicle_status")
    driver_status = postgresql.ENUM("Available", "On Trip", "Off Duty", "Suspended", name="driver_status")
    trip_status = postgresql.ENUM("Draft", "Dispatched", "Completed", "Cancelled", name="trip_status")
    maintenance_status = postgresql.ENUM("Open", "Closed", name="maintenance_status")
    user_role.create(op.get_bind(), checkfirst=True)
    vehicle_status.create(op.get_bind(), checkfirst=True)
    driver_status.create(op.get_bind(), checkfirst=True)
    trip_status.create(op.get_bind(), checkfirst=True)
    maintenance_status.create(op.get_bind(), checkfirst=True)
    user_role = postgresql.ENUM(name="user_role", create_type=False)
    vehicle_status = postgresql.ENUM(name="vehicle_status", create_type=False)
    driver_status = postgresql.ENUM(name="driver_status", create_type=False)
    trip_status = postgresql.ENUM(name="trip_status", create_type=False)
    maintenance_status = postgresql.ENUM(name="maintenance_status", create_type=False)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(160), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "vehicles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reg_number", sa.String(40), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("type", sa.String(60), nullable=False),
        sa.Column("region", sa.String(80)),
        sa.Column("max_load_kg", sa.Numeric(10, 2), nullable=False),
        sa.Column("odometer", sa.Numeric(12, 2), server_default="0"),
        sa.Column("acquisition_cost", sa.Numeric(12, 2)),
        sa.Column("status", vehicle_status, nullable=False, server_default="Available"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_vehicles_reg_number", "vehicles", ["reg_number"], unique=True)
    op.create_index("ix_vehicles_status", "vehicles", ["status"])

    op.create_table(
        "drivers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("license_number", sa.String(60), nullable=False),
        sa.Column("license_category", sa.String(20)),
        sa.Column("license_expiry", sa.Date(), nullable=False),
        sa.Column("contact_number", sa.String(30)),
        sa.Column("safety_score", sa.Numeric(5, 2), server_default="100"),
        sa.Column("status", driver_status, nullable=False, server_default="Available"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_drivers_license_number", "drivers", ["license_number"], unique=True)
    op.create_index("ix_drivers_status", "drivers", ["status"])

    op.create_table(
        "trips",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(160), nullable=False),
        sa.Column("destination", sa.String(160), nullable=False),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vehicles.id")),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("drivers.id")),
        sa.Column("cargo_weight", sa.Numeric(10, 2), nullable=False),
        sa.Column("planned_distance", sa.Numeric(10, 2), nullable=False),
        sa.Column("actual_distance", sa.Numeric(10, 2)),
        sa.Column("fuel_consumed", sa.Numeric(10, 2)),
        sa.Column("status", trip_status, nullable=False, server_default="Draft"),
        sa.Column("dispatch_score", sa.Numeric(5, 2)),
        sa.Column("dispatched_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("cargo_weight >= 0", name="cargo_within_capacity"),
    )
    op.create_index("ix_trips_status", "trips", ["status"])
    op.create_index("ix_trips_vehicle_id", "trips", ["vehicle_id"])
    op.create_index("ix_trips_driver_id", "trips", ["driver_id"])

    op.create_table(
        "maintenance_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("cost", sa.Numeric(10, 2), server_default="0"),
        sa.Column("status", maintenance_status, nullable=False, server_default="Open"),
        sa.Column("opened_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_maintenance_logs_vehicle_id", "maintenance_logs", ["vehicle_id"])
    op.create_index("ix_maintenance_logs_status", "maintenance_logs", ["status"])

    op.create_table(
        "fuel_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trips.id")),
        sa.Column("liters", sa.Numeric(10, 2), nullable=False),
        sa.Column("cost", sa.Numeric(10, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("odometer_at_fill", sa.Numeric(12, 2)),
    )
    op.create_index("ix_fuel_logs_vehicle_id", "fuel_logs", ["vehicle_id"])

    op.create_table(
        "expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("vehicle_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("type", sa.String(60), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text()),
    )
    op.create_index("ix_expenses_vehicle_id", "expenses", ["vehicle_id"])


def downgrade() -> None:
    op.drop_table("expenses")
    op.drop_table("fuel_logs")
    op.drop_table("maintenance_logs")
    op.drop_table("trips")
    op.drop_table("drivers")
    op.drop_table("vehicles")
    op.drop_table("users")
    for enum_name in ["maintenance_status", "trip_status", "driver_status", "vehicle_status", "user_role"]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
