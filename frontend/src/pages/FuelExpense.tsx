import { FormEvent, useEffect, useState } from "react";
import { Vehicle } from "../api/client";
import { moneyApi, vehiclesApi } from "../api/resources";

export function FuelExpense() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuel, setFuel] = useState({ vehicle_id: "", liters: "40", cost: "160", date: new Date().toISOString().slice(0, 10) });
  const [expense, setExpense] = useState({ vehicle_id: "", type: "toll", amount: "30", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [anomalyFlags, setAnomalyFlags] = useState<string[]>([]);
  useEffect(() => { vehiclesApi.list().then((r) => { setVehicles(r.data); const id = r.data[0]?.id ?? ""; setFuel((f) => ({ ...f, vehicle_id: id })); setExpense((e) => ({ ...e, vehicle_id: id })); }); }, []);
  async function saveFuel(e: FormEvent) {
    e.preventDefault();
    const response = await moneyApi.createFuel(fuel);
    setAnomalyFlags(response.data.anomaly_flags ?? []);
  }
  async function saveExpense(e: FormEvent) { e.preventDefault(); await moneyApi.createExpense(expense); }
  const vehicleSelect = (value: string, onChange: (v: string) => void) => <select className="w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors" value={value} onChange={(e) => onChange(e.target.value)}>{vehicles.map((v) => <option key={v.id} value={v.id} className="bg-bg-deep text-ink-hi">{v.name}</option>)}</select>;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={saveFuel} className="space-y-4 bg-panel border border-hairline rounded-lg p-5">
        <h1 className="text-xl font-bold font-display uppercase tracking-wide text-ink-hi">Fuel Log</h1>
        {anomalyFlags.length > 0 && (
          <div className="rounded border border-status-warn bg-status-warn/10 p-4 text-sm text-status-warn">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold uppercase tracking-wider text-xs">Anomaly warning</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-hi">{anomalyFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
              </div>
              <button type="button" className="rounded px-2 text-status-warn hover:bg-status-warn/20 transition-colors" onClick={() => setAnomalyFlags([])}>Dismiss</button>
            </div>
          </div>
        )}
        {vehicleSelect(fuel.vehicle_id, (vehicle_id) => setFuel({ ...fuel, vehicle_id }))}
        {["liters", "cost", "date"].map((key) => <label key={key} className="block text-sm font-medium capitalize text-ink-hi">{key}<input className="mt-1 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors" value={(fuel as any)[key]} onChange={(e) => setFuel({ ...fuel, [key]: e.target.value })} /></label>)}
        <button className="w-full rounded-md bg-accent hover:bg-accent/90 transition-colors px-4 py-2 font-semibold text-bg-deep mt-2">Save fuel</button>
      </form>
      <form onSubmit={saveExpense} className="space-y-4 bg-panel border border-hairline rounded-lg p-5">
        <h1 className="text-xl font-bold font-display uppercase tracking-wide text-ink-hi">Expense</h1>
        {vehicleSelect(expense.vehicle_id, (vehicle_id) => setExpense({ ...expense, vehicle_id }))}
        {["type", "amount", "date", "notes"].map((key) => <label key={key} className="block text-sm font-medium capitalize text-ink-hi">{key}<input className="mt-1 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2 rounded-md focus:border-accent focus:outline-none transition-colors" value={(expense as any)[key]} onChange={(e) => setExpense({ ...expense, [key]: e.target.value })} /></label>)}
        <button className="w-full rounded-md bg-ink-hi text-bg-deep hover:bg-ink-hi/90 transition-colors px-4 py-2 font-semibold mt-2">Save expense</button>
      </form>
    </div>
  );
}
