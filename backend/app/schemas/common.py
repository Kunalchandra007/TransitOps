from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import DriverStatus, MaintenanceStatus, TripStatus, UserRole, VehicleStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole


class UserRead(ORMModel):
    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VehicleBase(BaseModel):
    reg_number: str
    name: str
    type: str
    region: str | None = None
    max_load_kg: Decimal
    odometer: Decimal = Decimal("0")
    acquisition_cost: Decimal | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    reg_number: str | None = None
    name: str | None = None
    type: str | None = None
    region: str | None = None
    max_load_kg: Decimal | None = None
    odometer: Decimal | None = None
    acquisition_cost: Decimal | None = None


class VehicleRead(VehicleBase, ORMModel):
    id: UUID
    status: VehicleStatus
    created_at: datetime


class DriverBase(BaseModel):
    user_id: UUID | None = None
    name: str
    license_number: str
    license_category: str | None = None
    license_expiry: date
    contact_number: str | None = None
    safety_score: Decimal = Decimal("100")


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    user_id: UUID | None = None
    name: str | None = None
    license_number: str | None = None
    license_category: str | None = None
    license_expiry: date | None = None
    contact_number: str | None = None
    safety_score: Decimal | None = None


class DriverRead(DriverBase, ORMModel):
    id: UUID
    status: DriverStatus
    created_at: datetime


class TripCreate(BaseModel):
    source: str
    destination: str
    cargo_weight: Decimal
    planned_distance: Decimal


class TripRead(TripCreate, ORMModel):
    id: UUID
    vehicle_id: UUID | None
    driver_id: UUID | None
    actual_distance: Decimal | None
    fuel_consumed: Decimal | None
    status: TripStatus
    dispatch_score: Decimal | None
    dispatched_at: datetime | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class DispatchRequest(BaseModel):
    vehicle_id: UUID
    driver_id: UUID


class CompleteTripRequest(BaseModel):
    actual_distance: Decimal
    fuel_consumed: Decimal


class RankedPair(BaseModel):
    vehicle: VehicleRead
    driver: DriverRead
    score: float
    reasons: list[str]


class ConflictSeverity(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class ConflictItem(BaseModel):
    type: str
    severity: ConflictSeverity
    message: str
    entity_id: UUID | None = None
    entity_type: str
    affected_trip_ids: list[UUID] = Field(default_factory=list)
    region: str | None = None


class RebalanceSuggestion(BaseModel):
    vehicle_id: UUID
    vehicle_reg: str
    trip_id: UUID
    driver_id: UUID
    score: float
    reasons: list[str]
    idle_days: int


class StatusWallTrip(BaseModel):
    destination: str
    planned_distance: Decimal


class StatusWallVehicle(BaseModel):
    reg_number: str
    type: str
    status: str
    current_driver_name: str | None = None
    current_trip: StatusWallTrip | None = None
    eta_estimate: str | None = None


class MaintenanceCreate(BaseModel):
    vehicle_id: UUID
    description: str
    cost: Decimal = Decimal("0")


class MaintenanceRead(MaintenanceCreate, ORMModel):
    id: UUID
    status: MaintenanceStatus
    opened_at: datetime
    closed_at: datetime | None


class FuelLogCreate(BaseModel):
    vehicle_id: UUID
    trip_id: UUID | None = None
    liters: Decimal
    cost: Decimal
    date: date
    odometer_at_fill: Decimal | None = None


class FuelLogRead(FuelLogCreate, ORMModel):
    id: UUID


class FuelLogCreateResponse(BaseModel):
    fuel_log: FuelLogRead
    anomaly_flags: list[str] = Field(default_factory=list)


class ExpenseCreate(BaseModel):
    vehicle_id: UUID
    type: str
    amount: Decimal
    date: date
    notes: str | None = None


class ExpenseRead(ExpenseCreate, ORMModel):
    id: UUID
