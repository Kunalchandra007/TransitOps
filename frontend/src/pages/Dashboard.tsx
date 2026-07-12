import { useEffect, useState } from "react";
import { Activity, ClipboardList, Route, Truck, Users, Wrench } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi } from "../api/resources";
import { ConflictRadarPanel } from "../components/ConflictRadarPanel";
import { FleetHealthGrid } from "../components/FleetHealthGrid";
import { KpiCard } from "../components/KpiCard";
import { RebalancePanel } from "../components/RebalancePanel";

export function Dashboard() {
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [health, setHealth] = useState([]);
  useEffect(() => {
    dashboardApi.kpis().then((r) => setKpis(r.data));
    dashboardApi.health().then((r) => setHealth(r.data));
  }, []);
  const chart = [
    { name: "Available", value: kpis.available_vehicles ?? 0 },
    { name: "In Shop", value: kpis.in_maintenance ?? 0 },
    { name: "Active Trips", value: kpis.active_trips ?? 0 },
    { name: "Draft Trips", value: kpis.pending_trips ?? 0 }
  ];
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Operations Dashboard</h1><p className="mt-1 text-sm text-text-muted">Live fleet capacity, trip flow, and health signals.</p></header>
      
      <div>
        <ConflictRadarPanel />
      </div>

      <div>
        <RebalancePanel />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '0ms' }}><KpiCard label="Active Vehicles" value={kpis.active_vehicles ?? 0} icon={Truck} /></div>
        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '40ms' }}><KpiCard label="Available Vehicles" value={kpis.available_vehicles ?? 0} icon={Activity} /></div>
        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '80ms' }}><KpiCard label="Drivers On Duty" value={kpis.drivers_on_duty ?? 0} icon={Users} /></div>
        <div className="flex-1 animate-fade-in-up" style={{ animationDelay: '120ms' }}><KpiCard label="Utilization" value={`${kpis.utilization_pct ?? 0}%`} icon={Route} /></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <section className="bg-panel rounded-xl hairline p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-text-primary font-display"><ClipboardList size={16} strokeWidth={1.5} />Trip & Maintenance Load</h2>
          <ResponsiveContainer width="100%" height={260}><BarChart data={chart}><XAxis dataKey="name" stroke="#7C8598" fontSize={12} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} stroke="#7C8598" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#1A2130', border: '1px solid #232B3B', color: '#E7EAF0' }} /><Bar dataKey="value" fill="#2DD4BF" radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
        </section>
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-text-primary font-display"><Wrench size={16} strokeWidth={1.5} />Fleet Health</h2>
          <FleetHealthGrid items={health} />
        </section>
      </div>
    </div>
  );
}
