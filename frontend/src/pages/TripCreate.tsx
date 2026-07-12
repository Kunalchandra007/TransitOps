import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RankedPair, Trip } from "../api/client";
import { tripsApi } from "../api/resources";
import { DispatchScoreCard } from "../components/DispatchScoreCard";

export function TripCreate() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ source: "North DC", destination: "Market Hub", cargo_weight: "450", planned_distance: "125", region: "North" });
  const [trip, setTrip] = useState<Trip | null>(searchParams.get("trip_id") ? {
    id: searchParams.get("trip_id")!,
    source: "",
    destination: "",
    cargo_weight: "",
    planned_distance: "",
    status: "Draft"
  } : null);
  const [pairs, setPairs] = useState<RankedPair[]>([]);
  const [selected, setSelected] = useState<RankedPair | null>(null);
  const prefilledVehicleId = searchParams.get("vehicle_id");
  const prefilledDriverId = searchParams.get("driver_id");

  async function score(e: FormEvent) {
    e.preventDefault();
    const created = await tripsApi.create({ source: form.source, destination: form.destination, cargo_weight: form.cargo_weight, planned_distance: form.planned_distance });
    setTrip(created.data);
    const ranked = await tripsApi.eligible(form.cargo_weight, form.region);
    setPairs(ranked.data);
    setSelected(ranked.data[0] ?? null);
  }

  async function dispatch() {
    if (!trip || !selected) return;
    const dispatched = await tripsApi.dispatch(trip.id, selected.vehicle.id, selected.driver.id);
    setTrip(dispatched.data);
  }

  async function dispatchPrefilled() {
    if (!trip || !prefilledVehicleId || !prefilledDriverId) return;
    const dispatched = await tripsApi.dispatch(trip.id, prefilledVehicleId, prefilledDriverId);
    setTrip(dispatched.data);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section>
        <h1 className="text-2xl font-bold font-display text-text-primary">Smart Dispatch</h1>
        {trip && prefilledVehicleId && prefilledDriverId && (
          <div className="mt-4 glass-panel-primary p-4 text-sm text-text-primary">
            <p className="font-semibold text-accent-signal">Prefilled rebalance assignment</p>
            <p className="mt-1 text-text-muted">Trip <span className="font-mono text-text-primary">{trip.id.slice(0, 8)}</span> · Vehicle <span className="font-mono text-text-primary">{prefilledVehicleId.slice(0, 8)}</span> · Driver <span className="font-mono text-text-primary">{prefilledDriverId.slice(0, 8)}</span></p>
            <button onClick={dispatchPrefilled} className="focus-ring mt-3 rounded bg-accent-live px-4 py-2 font-semibold text-bg-base">Dispatch suggested assignment</button>
          </div>
        )}
        <form onSubmit={score} className="mt-4 space-y-3 glass-panel p-4">
          {Object.keys(form).map((key) => <label key={key} className="block text-sm font-medium capitalize text-text-primary">{key.replace("_", " ")}<input className="focus-ring mt-1 w-full px-3 py-2" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
          <button className="focus-ring w-full rounded bg-accent-live px-4 py-2 font-semibold text-bg-base">Create draft and score</button>
        </form>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold font-display text-text-primary">Ranked Assignments</h2>{trip && <span className="text-sm font-mono text-text-muted">Trip status: {trip.status}</span>}</div>
        <div className="space-y-3">
          {pairs.map((pair) => <DispatchScoreCard key={`${pair.vehicle.id}-${pair.driver.id}`} pair={pair} selected={selected === pair} onSelect={() => setSelected(pair)} />)}
        </div>
        {selected && <button onClick={dispatch} className="focus-ring mt-4 rounded bg-accent-live px-4 py-2 font-semibold text-bg-base">Dispatch selected pair</button>}
      </section>
    </div>
  );
}
