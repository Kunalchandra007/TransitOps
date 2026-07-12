import { createBrowserRouter, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Fuel, Gauge, LogOut, MapPinned, Route, ShieldCheck, Truck, Users, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
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
import Landing from "./pages/Landing";

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
    ["/dashboard", "Dashboard", Gauge],
    ["/dashboard/vehicles", "Vehicles", Truck],
    ["/dashboard/drivers", "Drivers", Users],
    ["/dashboard/trips", "Trips", Route],
    ["/dashboard/status-wall", "Status Wall", MapPinned],
    ["/dashboard/dispatch", "Dispatch", ShieldCheck],
    ["/dashboard/maintenance", "Maintenance", Wrench],
    ["/dashboard/fuel-expense", "Fuel & Cost", Fuel],
    ["/dashboard/reports", "Reports", BarChart3]
  ] as const;
  return (
    <div className="min-h-screen bg-bg-deep text-ink-mid font-body">
      {/* Sidebar */}
      <nav className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-panel border-r border-hairline transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        <div className="flex items-center justify-between p-4 mb-4 border-b border-hairline">
          {!collapsed && (
            <div className="flex items-center gap-2 font-display tracking-widest text-lg text-ink-hi uppercase">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-live" />
              TransitOps
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 text-ink-low hover:text-ink-hi hover:bg-panel-alt rounded-lg transition-colors">
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
          {items.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end className={({ isActive }) => `nav-item flex items-center gap-3 ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""}`} title={collapsed ? label : undefined}>
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </div>
        
        {/* User Profile Area */}
        <div className="p-4 border-t border-hairline bg-panel-alt/50 m-2 rounded-xl">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-accent text-bg-deep flex items-center justify-center font-bold text-sm shrink-0">
              M
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-hi truncate">Manager</p>
                <p className="text-xs text-ink-low truncate">Operations</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="p-2 text-ink-low hover:text-accent rounded-lg transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
          {collapsed && (
            <button onClick={logout} className="w-full mt-4 p-2 flex justify-center text-ink-low hover:text-accent rounded-lg transition-colors" title="Sign out">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </nav>
      {/* Main Content */}
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"} p-8`}>
        <Outlet />
      </main>
    </div>
  );
}

function AutoLoginDemo() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    login("manager@transitops.io", "TransitOps123")
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err) => {
        console.error("Demo login failed:", err);
        navigate("/login");
      });
  }, [login, navigate]);

  return <div className="min-h-screen bg-bg-deep flex items-center justify-center text-ink-low font-body tracking-wider uppercase">Loading demo...</div>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/demo", element: <AutoLoginDemo /> },
  { path: "/login", element: <Login /> },
  {
    path: "/dashboard",
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
