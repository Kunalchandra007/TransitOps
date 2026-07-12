import enum


class UserRole(str, enum.Enum):
    fleet_manager = "fleet_manager"
    driver = "driver"
    safety_officer = "safety_officer"
    financial_analyst = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    available = "Available"
    on_trip = "On Trip"
    in_shop = "In Shop"
    retired = "Retired"


class DriverStatus(str, enum.Enum):
    available = "Available"
    on_trip = "On Trip"
    off_duty = "Off Duty"
    suspended = "Suspended"


class TripStatus(str, enum.Enum):
    draft = "Draft"
    dispatched = "Dispatched"
    completed = "Completed"
    cancelled = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    open = "Open"
    closed = "Closed"
