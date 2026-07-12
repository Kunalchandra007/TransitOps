import { FormEvent, useEffect, useState } from "react";
import { vehiclesApi } from "../api/resources";
import { Vehicle } from "../api/client";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";

export function VehicleRegistry() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ reg_number: "", name: "", type: "Van", region: "North", max_load_kg: "600", acquisition_cost: "42000" });
  const load = () => vehiclesApi.list().then((r) => setRows(r.data));
  useEffect(() => {
    load();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await vehiclesApi.create(form);
    setForm({ ...form, reg_number: "", name: "" });
    load();
  }
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Vehicle Registry</h1></header>
      <form onSubmit={submit} className="grid gap-3 glass-panel p-4 md:grid-cols-6">
        {["reg_number", "name", "type", "region", "max_load_kg", "acquisition_cost"].map((key) => <input key={key} placeholder={key} className="focus-ring px-3 py-2 text-sm" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <button className="focus-ring rounded bg-accent-live px-4 py-2 text-sm font-semibold text-bg-base md:col-span-6">Add vehicle</button>
      </form>
      <DataTable rows={rows} columns={[
        { key: "reg", label: "Registration", render: (r) => r.reg_number },
        { key: "name", label: "Name", render: (r) => r.name },
        { key: "type", label: "Type", render: (r) => r.type },
        { key: "load", label: "Max Load", render: (r) => `${r.max_load_kg} kg` },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }
      ]} />
    </div>
  );
}
