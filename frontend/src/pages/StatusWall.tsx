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
        <h1 className="flex items-center gap-3 font-display text-2xl font-bold text-text-primary"><MapPinned size={24} strokeWidth={1.5} className="text-accent-live" />Live Fleet Status Wall</h1>
        <p className="mt-1 text-sm text-text-muted">Vehicle availability, active drivers, destinations, and simple ETA estimates.</p>
      </header>
      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((status) => {
          const vehicles = groups[status] ?? [];
          return (
            <section key={status} className="bg-bg-base hairline p-4 flex flex-col gap-3">
              <div className="flex items-end justify-between border-b border-border-hairline pb-2">
                <h2 className="font-display font-semibold text-text-primary">{status}</h2>
                <span className="font-mono text-3xl leading-none text-text-muted">{vehicles.length}</span>
              </div>
              <div className="space-y-3 flex-1">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No vehicles currently {status.toLowerCase()}.</p>
                ) : (
                  vehicles.map((vehicle) => (
                    <div key={vehicle.reg_number} className={`bg-panel hairline p-3 ${status === "On Trip" ? "border-l-[3px] border-l-accent-live/50 animate-pulse-live" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono font-semibold text-text-primary">{vehicle.reg_number}</p>
                          <p className="text-[10px] uppercase text-text-muted">{vehicle.type}</p>
                        </div>
                        <StatusBadge value={vehicle.status} />
                      </div>
                      {vehicle.current_trip && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-text-muted">
                          <div>
                            <p className="uppercase opacity-70 text-[9px]">Driver</p>
                            <p className="text-text-primary">{vehicle.current_driver_name ?? "Unassigned"}</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[9px]">Destination</p>
                            <p className="text-text-primary">{vehicle.current_trip.destination}</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[9px]">Distance</p>
                            <p className="text-text-primary">{vehicle.current_trip.planned_distance} km</p>
                          </div>
                          <div>
                            <p className="uppercase opacity-70 text-[9px]">ETA</p>
                            <p className="text-accent-live">{vehicle.eta_estimate ?? "Pending"}</p>
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
