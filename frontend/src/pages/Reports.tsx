import { useEffect, useState } from "react";
import { reportsApi } from "../api/resources";
import { DataTable } from "../components/DataTable";

export function Reports() {
  const [utilization, setUtilization] = useState<any[]>([]);
  const [cost, setCost] = useState<any>({});
  useEffect(() => {
    reportsApi.utilization().then((r) => setUtilization(r.data));
    reportsApi.cost().then((r) => setCost(r.data));
  }, []);
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold font-display text-text-primary">Reports</h1><p className="mt-1 text-sm text-text-muted">Cost, utilization, fuel efficiency, ROI, and CSV export endpoints are available.</p></header>
      <div className="glass-panel p-4"><p className="text-sm text-text-muted font-mono uppercase">Operational cost</p><p className="text-3xl font-mono text-text-primary mt-1">${Number(cost.cost ?? 0).toFixed(2)}</p></div>
      <DataTable rows={utilization} columns={[
        { key: "vehicle", label: "Vehicle ID", render: (r) => r.vehicle_id ?? "Unassigned" },
        { key: "trips", label: "Completed Trips", render: (r) => r.completed_trips }
      ]} />
    </div>
  );
}
