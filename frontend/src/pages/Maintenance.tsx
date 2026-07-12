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
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Maintenance</h1></header>
      <form onSubmit={submit} className="grid gap-3 glass-panel p-4 md:grid-cols-4">
        <select className="focus-ring px-3 py-2" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>{vehicles.map((v) => <option key={v.id} value={v.id} className="text-bg-base">{v.name}</option>)}</select>
        <input className="focus-ring px-3 py-2 md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="focus-ring px-3 py-2" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        <button className="focus-ring rounded bg-accent-live px-4 py-2 font-semibold text-bg-base md:col-span-4">Open log</button>
      </form>
      <DataTable rows={logs} columns={[
        { key: "desc", label: "Description", render: (r) => r.description },
        { key: "cost", label: "Cost", render: (r) => `$${r.cost}` },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { key: "action", label: "Action", render: (r) => r.status === "Open" ? <button className="text-signal" onClick={() => maintenanceApi.close(r.id).then(load)}>Close</button> : "Closed" }
      ]} />
    </div>
  );
}
