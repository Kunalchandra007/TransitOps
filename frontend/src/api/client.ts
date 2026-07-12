import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
console.log("TransitOps API is pointing to:", apiBaseUrl);

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("transitops_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Role = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";
export type Vehicle = { id: string; reg_number: string; name: string; type: string; region?: string; max_load_kg: string; odometer: string; acquisition_cost?: string; status: string };
export type Driver = { id: string; name: string; license_number: string; license_category?: string; license_expiry: string; safety_score: string; status: string };
export type Trip = { id: string; source: string; destination: string; cargo_weight: string; planned_distance: string; vehicle_id?: string; driver_id?: string; status: string; dispatch_score?: string };
export type RankedPair = { vehicle: Vehicle; driver: Driver; score: number; reasons: string[] };
