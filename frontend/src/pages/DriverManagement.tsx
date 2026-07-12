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
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold font-display uppercase tracking-wide text-ink-hi">Driver Management</h1></header>
      <form onSubmit={submit} className="grid gap-4 bg-panel border border-hairline rounded-lg p-5 md:grid-cols-5">
        {Object.keys(form).map((key) => <input key={key} placeholder={key.replace("_", " ")} className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors capitalize placeholder:text-ink-low/50 text-sm" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <button className="rounded-md bg-accent hover:bg-accent/90 transition-colors px-4 py-2 text-sm font-semibold text-bg-deep md:col-span-5">Add driver</button>
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
