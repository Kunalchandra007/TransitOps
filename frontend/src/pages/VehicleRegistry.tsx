import { FormEvent, useEffect, useMemo, useState } from "react";
import { vehiclesApi } from "../api/resources";
import { Vehicle } from "../api/client";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";

export function VehicleRegistry() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ reg_number: "", name: "", type: "Van", region: "North", max_load_kg: "600", acquisition_cost: "42000" });
  const load = () => vehiclesApi.list().then((r) => setRows(r.data));
  useEffect(() => {
    load();
  }, []);
  const statusOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.status))).sort(), [rows]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = normalizedQuery === "" || [row.reg_number, row.name, row.type, row.region ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);
  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    await vehiclesApi.create(form);
    setForm({ ...form, reg_number: "", name: "" });
    load();
  }
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold font-display uppercase tracking-wide text-ink-hi">Vehicle Registry</h1></header>
      <form onSubmit={submit} className="grid gap-4 bg-panel border border-hairline rounded-lg p-5 md:grid-cols-6">
        {["reg_number", "name", "type", "region", "max_load_kg", "acquisition_cost"].map((key) => <input key={key} placeholder={key.replace("_", " ")} className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors capitalize placeholder:text-ink-low/50 text-sm" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <button className="rounded-md bg-accent hover:bg-accent/90 transition-colors px-4 py-2 text-sm font-semibold text-bg-deep md:col-span-6">Add vehicle</button>
      </form>
      <section className="space-y-4 bg-panel border border-hairline rounded-lg p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex-1 text-sm font-medium text-ink-hi">
            Search vehicles
            <input
              className="mt-2 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors placeholder:text-ink-low/50"
              placeholder="Search by registration, name, type or region"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-ink-hi md:w-56">
            Status
            <select
              className="mt-2 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all" className="text-ink-hi bg-bg-deep">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status} className="text-ink-hi bg-bg-deep">{status}</option>)}
            </select>
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              className="rounded-md border border-hairline px-4 py-2 text-sm font-semibold text-ink-hi transition-colors hover:bg-panel-alt focus:border-accent focus:outline-none"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-sm text-ink-low">Showing {filteredRows.length} of {rows.length} vehicles</p>
      </section>
      {rows.length === 0 ? (
        <div className="bg-panel border border-hairline rounded-lg p-5 text-sm text-ink-low">No vehicles have been added yet.</div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-panel border border-hairline rounded-lg p-5 text-sm text-ink-low">No vehicles match the selected filters.</div>
      ) : (
        <DataTable rows={filteredRows} columns={[
          { key: "reg", label: "Registration", render: (r) => r.reg_number },
          { key: "name", label: "Name", render: (r) => r.name },
          { key: "type", label: "Type", render: (r) => r.type },
          { key: "load", label: "Max Load", render: (r) => `${r.max_load_kg} kg` },
          { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }
        ]} />
      )}
    </div>
  );
}
