import { useEffect, useState } from "react";
import { Trip } from "../api/client";
import { tripsApi } from "../api/resources";
import { DataTable } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";

export function TripManagement() {
  const [rows, setRows] = useState<Trip[]>([]);
  const load = () => tripsApi.list().then((r) => setRows(r.data));
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Trip Management</h1><p className="text-sm text-slate-500">Create new assignments from the Dispatch view.</p></header>
      <DataTable rows={rows} columns={[
        { key: "route", label: "Route", render: (r) => `${r.source} → ${r.destination}` },
        { key: "cargo", label: "Cargo", render: (r) => `${r.cargo_weight} kg` },
        { key: "distance", label: "Planned", render: (r) => `${r.planned_distance} km` },
        { key: "score", label: "Dispatch Score", render: (r) => r.dispatch_score ?? "Pending" },
        { key: "status", label: "Status", render: (r) => <StatusBadge value={r.status} /> }
      ]} />
    </div>
  );
}
