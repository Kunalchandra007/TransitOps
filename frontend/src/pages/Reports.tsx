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
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold font-display uppercase tracking-wide text-ink-hi">Reports</h1><p className="mt-2 text-sm text-ink-low">Cost, utilization, fuel efficiency, ROI, and CSV export endpoints are available.</p></header>
      <div className="bg-panel border border-hairline rounded-lg p-5"><p className="text-sm text-ink-low font-mono uppercase tracking-wider">Operational cost</p><p className="text-3xl font-mono font-semibold text-ink-hi mt-2">${Number(cost.cost ?? 0).toFixed(2)}</p></div>
      <DataTable rows={utilization} columns={[
        { key: "vehicle", label: "Vehicle ID", render: (r) => r.vehicle_id ?? "Unassigned" },
        { key: "trips", label: "Completed Trips", render: (r) => r.completed_trips }
      ]} />
    </div>
  );
}
