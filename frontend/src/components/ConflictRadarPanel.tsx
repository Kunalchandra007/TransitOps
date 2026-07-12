import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { RankedPair } from "../api/client";
import { dashboardApi } from "../api/resources";
import { DispatchScoreCard } from "./DispatchScoreCard";

type ConflictItem = {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  entity_id?: string | null;
  entity_type: string;
  affected_trip_ids: string[];
  region?: string | null;
};

const severityStyle: Record<ConflictItem["severity"], string> = {
  high: "border-l-status-bad",
  medium: "border-l-status-warn",
  low: "border-l-status-good"
};

const RadarIcon = () => (
  <div className="relative flex h-5 w-5 items-center justify-center rounded-full border border-accent/30">
    <div className="absolute h-full w-full rounded-full border border-accent/10"></div>
    <div className="absolute h-1/2 w-[1px] origin-bottom top-0 bg-gradient-to-t from-accent to-transparent animate-radar-sweep"></div>
  </div>
);

export function ConflictRadarPanel() {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [suggestions, setSuggestions] = useState<Record<number, RankedPair[]>>({});
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    dashboardApi.conflicts().then((response) => setConflicts(response.data));
  }, []);

  async function suggestFix(index: number) {
    setLoadingIndex(index);
    try {
      const response = await dashboardApi.conflictSuggestions(index);
      setSuggestions((current) => ({ ...current, [index]: response.data }));
    } catch (e) {
      console.error("Failed to fetch conflict suggestions:", e);
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <section className="bg-panel border border-hairline rounded-xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-accent-dim opacity-20 pointer-events-none" />
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-hairline pb-4">
          <h2 className="flex items-center gap-3 font-semibold font-body text-ink-hi"><RadarIcon />Predictive Conflict Radar</h2>
          <span className="font-mono text-xs text-ink-mid">{conflicts.length} active</span>
        </div>
        {conflicts.length === 0 ? (
          <p className="text-sm text-ink-low">No upcoming conflicts detected.</p>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div key={`${conflict.type}-${index}`} className={`bg-bg-deep border border-hairline border-l-4 rounded p-4 transition-colors hover:border-ink-low ${severityStyle[conflict.severity]}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[11px] tracking-wider uppercase text-ink-mid">{conflict.severity} · {conflict.type.replace("_", " ")}</p>
                    <p className="mt-2 text-sm text-ink-hi font-medium">{conflict.message}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); suggestFix(index); }} className="inline-flex items-center justify-center gap-2 border border-hairline bg-panel hover:bg-panel-alt transition-colors px-4 py-2 text-sm font-semibold text-ink-hi rounded-full shrink-0">
                    <Lightbulb size={16} strokeWidth={1.5} className="text-accent" />{loadingIndex === index ? "Checking" : "Suggest Fix"}
                  </button>
              </div>
              {suggestions[index]?.length > 0 && (
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {suggestions[index].map((pair) => (
                    <DispatchScoreCard key={`${pair.vehicle.id}-${pair.driver.id}`} pair={pair} selected={false} onSelect={() => undefined} />
                  ))}
                </div>
              )}
              {suggestions[index]?.length === 0 && <p className="mt-3 font-mono text-[11px] text-ink-low">No alternate ranked assignments found.</p>}
            </div>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}
