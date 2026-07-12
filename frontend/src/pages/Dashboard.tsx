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
      <header><h1 className="text-2xl font-bold font-body text-ink-hi uppercase tracking-wide">Operations Dashboard</h1><p className="mt-2 text-sm text-ink-low">Live fleet capacity, trip flow, and health signals.</p></header>
      
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
        <section className="bg-panel border border-hairline rounded-xl p-5">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-ink-hi font-body border-b border-hairline pb-4"><ClipboardList size={18} strokeWidth={1.5} className="text-accent" />Trip & Maintenance Load</h2>
          <ResponsiveContainer width="100%" height={260}><BarChart data={chart}><XAxis dataKey="name" stroke="#B8BAC2" fontSize={11} tickLine={false} axisLine={false} tick={{ fontFamily: 'JetBrains Mono' }} /><YAxis allowDecimals={false} stroke="#B8BAC2" fontSize={11} tickLine={false} axisLine={false} tick={{ fontFamily: 'JetBrains Mono' }} /><Tooltip contentStyle={{ backgroundColor: '#1A1D24', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F4F0', fontFamily: 'JetBrains Mono' }} /><Bar dataKey="value" fill="#FF6B4A" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </section>
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink-hi font-body"><Wrench size={18} strokeWidth={1.5} className="text-accent" />Fleet Health</h2>
          <FleetHealthGrid items={health} />
        </section>
      </div>
    </div>
  );
}
