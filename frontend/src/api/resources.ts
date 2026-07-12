import { api } from "./client";

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  signup: (payload: unknown) => api.post("/auth/signup", payload),
  me: () => api.get("/auth/me")
};

export const vehiclesApi = {
  list: () => api.get("/vehicles"),
  create: (payload: unknown) => api.post("/vehicles", payload),
  retire: (id: string) => api.delete(`/vehicles/${id}`)
};

export const driversApi = {
  list: () => api.get("/drivers"),
  create: (payload: unknown) => api.post("/drivers", payload)
};

export const tripsApi = {
  list: () => api.get("/trips"),
  create: (payload: unknown) => api.post("/trips", payload),
  eligible: (cargoWeight: string, region?: string) => api.get("/trips/eligible-vehicles", { params: { cargo_weight: cargoWeight, region } }),
  dispatch: (tripId: string, vehicleId: string, driverId: string) => api.post(`/trips/${tripId}/dispatch`, { vehicle_id: vehicleId, driver_id: driverId }),
  complete: (tripId: string, actual_distance: string, fuel_consumed: string) => api.post(`/trips/${tripId}/complete`, { actual_distance, fuel_consumed })
};

export const maintenanceApi = {
  list: () => api.get("/maintenance"),
  create: (payload: unknown) => api.post("/maintenance", payload),
  close: (id: string) => api.post(`/maintenance/${id}/close`)
};

export const moneyApi = {
  fuelLogs: () => api.get("/fuel-logs"),
  createFuel: (payload: unknown) => api.post("/fuel-logs", payload),
  expenses: () => api.get("/expenses"),
  createExpense: (payload: unknown) => api.post("/expenses", payload)
};

export const dashboardApi = {
  kpis: () => api.get("/dashboard/kpis"),
  health: () => api.get("/dashboard/fleet-health"),
  conflicts: () => api.get("/dashboard/conflict-radar"),
  conflictSuggestions: (index: number) => api.get(`/dashboard/conflict-radar/${index}/suggestions`),
  rebalanceSuggestions: () => api.get("/dashboard/rebalance-suggestions"),
  statusWall: () => api.get("/dashboard/status-wall")
};

export const reportsApi = {
  utilization: () => api.get("/reports/utilization"),
  cost: () => api.get("/reports/operational-cost"),
  exportCsv: () => api.get("/reports/export", { responseType: "blob" })
};
