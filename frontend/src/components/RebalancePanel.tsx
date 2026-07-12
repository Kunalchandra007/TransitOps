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
    <section className="bg-panel border border-hairline rounded-xl p-5">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-hairline pb-4">
        <h2 className="flex items-center gap-2 font-semibold font-body text-ink-hi"><ArrowRightLeft className="h-5 w-5 text-accent" />Utilization Rebalancer</h2>
        <span className="rounded bg-panel-alt px-2 py-1 text-xs font-mono font-semibold text-ink-mid">{suggestions.length} suggestions</span>
      </div>
      {suggestions.length === 0 ? (
        <p className="text-sm text-ink-low">No underutilized vehicle matches found.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {suggestions.map((suggestion) => (
            <div key={`${suggestion.vehicle_id}-${suggestion.trip_id}`} className="bg-panel-alt border border-hairline rounded-lg p-4 transition-all hover:border-ink-low">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-hi text-sm uppercase tracking-wider">{suggestion.vehicle_reg} <span className="text-status-warn lowercase">idle {suggestion.idle_days} days</span></p>
                  <p className="mt-2 text-sm text-ink-mid font-mono">{suggestion.score}% fit for trip {suggestion.trip_id.slice(0, 8)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{suggestion.reasons.map((reason) => <span className="rounded border border-hairline bg-bg-deep px-2 py-1 text-xs text-ink-mid" key={reason}>{reason}</span>)}</div>
                </div>
                <button
                  className="rounded-full bg-accent hover:bg-accent/90 transition-colors px-4 py-2 text-sm font-semibold text-bg-deep shrink-0"
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
