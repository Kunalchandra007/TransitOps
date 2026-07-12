import { FormEvent, useEffect, useState } from "react";
import { maintenanceApi, vehiclesApi } from "../api/resources";
import { Vehicle } from "../api/client";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";

export function Maintenance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicle_id: "", description: "Preventive service", cost: "250" });
  const load = () => { maintenanceApi.list().then((r) => setLogs(r.data)); vehiclesApi.list().then((r) => { setVehicles(r.data); setForm((f) => ({ ...f, vehicle_id: f.vehicle_id || r.data[0]?.id || "" })); }); };
  useEffect(load, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await maintenanceApi.create(form);
    load();
  }
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold font-display uppercase tracking-wide text-ink-hi">Maintenance</h1></header>
      <form onSubmit={submit} className="grid gap-4 bg-panel border border-hairline rounded-lg p-5 md:grid-cols-4">
        <select className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>{vehicles.map((v) => <option key={v.id} value={v.id} className="text-ink-hi bg-bg-deep">{v.name}</option>)}</select>
        <input className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        <button className="rounded-md bg-accent hover:bg-accent/90 transition-colors px-4 py-2 font-semibold text-bg-deep md:col-span-4">Open log</button>
      </form>
      <DataTable rows={logs} columns={[
        { key: "desc", label: "Description", render: (r) => r.description },
        { key: "cost", label: "Cost", render: (r) => `$${r.cost}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "action", label: "Action", render: (r) => r.status === "Open" ? <button className="text-status-warn hover:text-status-warn/80 font-semibold" onClick={() => maintenanceApi.close(r.id).then(load)}>Close</button> : "Closed" }
      ]} />
    </div>
  );
}
