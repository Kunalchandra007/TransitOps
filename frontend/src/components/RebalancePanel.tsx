import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";
import { dashboardApi } from "../api/resources";

type RebalanceSuggestion = {
  vehicle_id: string;
  vehicle_reg: string;
  trip_id: string;
  driver_id: string;
  score: number;
  reasons: string[];
  idle_days: number;
};

export function RebalancePanel() {
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.rebalanceSuggestions().then((response) => setSuggestions(response.data));
  }, []);

  return (
    <section className="glass-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold font-display text-text-primary"><ArrowRightLeft className="h-4 w-4 text-accent-signal" />Utilization Rebalancer</h2>
        <span className="rounded bg-panel-raised px-2 py-1 text-xs font-semibold text-text-primary">{suggestions.length} suggestions</span>
      </div>
      {suggestions.length === 0 ? (
        <p className="text-sm text-slate-500">No underutilized vehicle matches found.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div key={`${suggestion.vehicle_id}-${suggestion.trip_id}`} className="glass-panel p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{suggestion.vehicle_reg} idle {suggestion.idle_days} days</p>
                  <p className="mt-1 text-sm text-text-muted">{suggestion.score}% fit for trip {suggestion.trip_id.slice(0, 8)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">{suggestion.reasons.map((reason) => <span className="rounded bg-panel-raised px-2 py-1 text-xs text-text-primary" key={reason}>{reason}</span>)}</div>
                </div>
                <button
                  className="focus-ring rounded bg-accent-live px-3 py-2 text-sm font-semibold text-bg-base"
                  onClick={() => navigate(`/dispatch?trip_id=${suggestion.trip_id}&vehicle_id=${suggestion.vehicle_id}&driver_id=${suggestion.driver_id}`)}
                >
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
