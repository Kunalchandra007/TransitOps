import { FormEvent, useEffect, useState } from "react";
import { Driver } from "../api/client";
import { driversApi } from "../api/resources";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";

export function DriverManagement() {
  const [rows, setRows] = useState<Driver[]>([]);
  const [form, setForm] = useState({ name: "", license_number: "", license_category: "B", license_expiry: "2027-12-31", safety_score: "92" });
  const load = () => driversApi.list().then((r) => setRows(r.data));
  useEffect(() => {
    load();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    await driversApi.create(form);
    setForm({ ...form, name: "", license_number: "" });
    load();
  }
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Driver Management</h1></header>
      <form onSubmit={submit} className="grid gap-3 glass-panel p-4 md:grid-cols-5">
        {Object.keys(form).map((key) => <input key={key} placeholder={key} className="focus-ring px-3 py-2 text-sm" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <button className="focus-ring rounded bg-accent-live px-4 py-2 text-sm font-semibold text-bg-base md:col-span-5">Add driver</button>
      </form>
      <DataTable rows={rows} columns={[
        { key: "name", label: "Name", render: (r) => r.name },
        { key: "license", label: "License", render: (r) => r.license_number },
        { key: "expiry", label: "Expiry", render: (r) => r.license_expiry },
        { key: "safety", label: "Safety", render: (r) => r.safety_score },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }
      ]} />
    </div>
  );
}
