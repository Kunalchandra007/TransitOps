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
  const vehicleSelect = (value: string, onChange: (v: string) => void) => <select className="focus-ring px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>{vehicles.map((v) => <option key={v.id} value={v.id} className="text-bg-base">{v.name}</option>)}</select>;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={saveFuel} className="space-y-3 glass-panel p-4">
        <h1 className="text-xl font-bold font-display text-text-primary">Fuel Log</h1>
        {anomalyFlags.length > 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Anomaly warning</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">{anomalyFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
              </div>
              <button type="button" className="rounded px-2 text-amber-900 hover:bg-amber-100" onClick={() => setAnomalyFlags([])}>Dismiss</button>
            </div>
          </div>
        )}
        {vehicleSelect(fuel.vehicle_id, (vehicle_id) => setFuel({ ...fuel, vehicle_id }))}
        {["liters", "cost", "date"].map((key) => <input key={key} className="focus-ring w-full px-3 py-2" value={(fuel as any)[key]} onChange={(e) => setFuel({ ...fuel, [key]: e.target.value })} />)}
        <button className="focus-ring rounded bg-signal px-4 py-2 font-semibold text-white">Save fuel</button>
      </form>
      <form onSubmit={saveExpense} className="space-y-3 glass-panel p-4">
        <h1 className="text-xl font-bold font-display text-text-primary">Expense</h1>
        {vehicleSelect(expense.vehicle_id, (vehicle_id) => setExpense({ ...expense, vehicle_id }))}
        {["type", "amount", "date", "notes"].map((key) => <input key={key} className="focus-ring w-full px-3 py-2" value={(expense as any)[key]} onChange={(e) => setExpense({ ...expense, [key]: e.target.value })} />)}
        <button className="focus-ring rounded bg-ink px-4 py-2 font-semibold text-white">Save expense</button>
      </form>
    </div>
  );
}
