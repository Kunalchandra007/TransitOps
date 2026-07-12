import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { dashboardApi } from "../api/resources";
import { StatusBadge } from "../components/StatusBadge";

type StatusWallVehicle = {
  reg_number: string;
  type: string;
  status: string;
  current_driver_name?: string | null;
  current_trip?: { destination: string; planned_distance: string } | null;
  eta_estimate?: string | null;
};

const columns = ["Available", "On Trip", "In Shop"] as const;

export function StatusWall() {
  const [groups, setGroups] = useState<Record<string, StatusWallVehicle[]>>({});

  useEffect(() => {
    dashboardApi.statusWall().then((response) => setGroups(response.data));
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-3 font-display uppercase tracking-wide text-2xl font-bold text-ink-hi"><MapPinned size={24} strokeWidth={1.5} className="text-accent" />Live Fleet Status Wall</h1>
        <p className="mt-2 text-sm text-ink-low">Vehicle availability, active drivers, destinations, and simple ETA estimates.</p>
      </header>
      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((status) => {
          const vehicles = groups[status] ?? [];
          return (
            <section key={status} className="bg-bg-deep border border-hairline rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-end justify-between border-b border-hairline pb-3">
                <h2 className="font-display uppercase tracking-wide font-semibold text-ink-hi">{status}</h2>
                <span className="font-mono text-3xl leading-none text-ink-mid">{vehicles.length}</span>
              </div>
              <div className="space-y-3 flex-1">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-ink-low italic">No vehicles currently {status.toLowerCase()}.</p>
                ) : (
                  vehicles.map((vehicle) => (
                    <div key={vehicle.reg_number} className={`bg-panel border border-hairline rounded-lg p-4 transition-colors hover:bg-panel-alt ${status === "On Trip" ? "border-l-4 border-l-accent/70" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono font-semibold text-ink-hi text-sm tracking-wide">{vehicle.reg_number}</p>
                          <p className="text-[11px] uppercase tracking-wider text-ink-low mt-1">{vehicle.type}</p>
                        </div>
                        <StatusBadge value={vehicle.status} />
                      </div>
                      {vehicle.current_trip && (
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono text-ink-low bg-bg-deep p-3 rounded border border-hairline">
                          <div>
                            <p className="uppercase opacity-70 text-[10px] mb-1">Driver</p>
                            <p className="text-ink-hi">{vehicle.current_driver_name ?? "Unassigned"}</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[10px] mb-1">Destination</p>
                            <p className="text-ink-hi truncate" title={vehicle.current_trip.destination}>{vehicle.current_trip.destination}</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[10px] mb-1">Distance</p>
                            <p className="text-ink-hi">{vehicle.current_trip.planned_distance} km</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[10px] mb-1">ETA</p>
                            <p className="text-accent">{vehicle.eta_estimate ?? "Pending"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
