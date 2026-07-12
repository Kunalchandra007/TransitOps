import { createBrowserRouter, Navigate, NavLink, Outlet } from "react-router-dom";
import { BarChart3, Fuel, Gauge, LogOut, MapPinned, Route, ShieldCheck, Truck, Users, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import { DriverManagement } from "./pages/DriverManagement";
import { FuelExpense } from "./pages/FuelExpense";
import { Login } from "./pages/Login";
import { Maintenance } from "./pages/Maintenance";
import { Reports } from "./pages/Reports";
import { StatusWall } from "./pages/StatusWall";
import { TripCreate } from "./pages/TripCreate";
import { TripManagement } from "./pages/TripManagement";
import { VehicleRegistry } from "./pages/VehicleRegistry";

const RadarIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center rounded-full border border-accent-live/30">
    <div className="absolute h-full w-full rounded-full border border-accent-live/10"></div>
    <div className="absolute h-1/2 w-[1px] origin-bottom top-0 bg-gradient-to-t from-accent-live to-transparent animate-radar-sweep"></div>
  </div>
);

function Layout() {
  const { token, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  if (!token) return <Navigate to="/login" replace />;
  const items = [
    ["/", "Dashboard", Gauge],
    ["/vehicles", "Vehicles", Truck],
    ["/drivers", "Drivers", Users],
    ["/trips", "Trips", Route],
    ["/status-wall", "Status Wall", MapPinned],
    ["/dispatch", "Dispatch", ShieldCheck],
    ["/maintenance", "Maintenance", Wrench],
    ["/fuel-expense", "Fuel & Cost", Fuel],
    ["/reports", "Reports", BarChart3]
  ] as const;
  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 hidden lg:flex flex-col transition-all duration-200 ${collapsed ? 'w-[76px]' : 'w-[280px]'} sidebar`}>
        <div className="flex h-16 items-center justify-between px-4 text-lg font-bold font-display text-text-primary">
          <div className="flex items-center gap-3">
            <RadarIcon />
            {!collapsed && <span>TransitOps</span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-text-muted hover:text-text-primary hover:bg-panel-raised rounded-full p-1.5 transition-colors">
            {collapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
          </button>
        </div>
        <div className="mx-4 mb-4 mt-2 h-px bg-white/10"></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `nav-item flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${isActive ? "active" : ""}`}>
              <Icon size={18} strokeWidth={1.5} />{!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          {!collapsed && (
            <div className="mx-2 mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-live/20 text-sm font-bold text-accent-live">FM</div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-text-primary">Sarah Miller</p>
                <p className="text-xs text-text-muted">Fleet Manager</p>
              </div>
            </div>
          )}
          <button onClick={logout} title={collapsed ? "Sign out" : undefined} className={`focus-ring w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors rounded-lg`}><LogOut size={18} strokeWidth={1.5} />{!collapsed && <span>Sign out</span>}</button>
        </div>
      </aside>
      <main className={`transition-all duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[280px]'}`}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><Outlet /></div>
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "vehicles", element: <VehicleRegistry /> },
      { path: "drivers", element: <DriverManagement /> },
      { path: "trips", element: <TripManagement /> },
      { path: "status-wall", element: <StatusWall /> },
      { path: "dispatch", element: <TripCreate /> },
      { path: "maintenance", element: <Maintenance /> },
      { path: "fuel-expense", element: <FuelExpense /> },
      { path: "reports", element: <Reports /> }
    ]
  }
]);
