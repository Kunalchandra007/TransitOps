import { CheckCircle2, Truck } from "lucide-react";
import { RankedPair } from "../api/client";

export function DispatchScoreCard({ pair, selected, onSelect }: { pair: RankedPair; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`focus-ring w-full text-left bg-panel hairline p-4 transition-colors ${selected ? "border-accent-live ring-1 ring-accent-live" : "hover:bg-panel-raised"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-text-primary"><Truck size={16} strokeWidth={1.5} />{pair.vehicle.name} + {pair.driver.name}</div>
          <p className="mt-1 font-mono text-[10px] uppercase text-text-muted">{pair.vehicle.reg_number} · {pair.vehicle.region ?? "Any region"} · Safety {pair.driver.safety_score}</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <p className="text-3xl font-mono text-accent-live">{pair.score}%</p>
          {selected && <CheckCircle2 className="h-5 w-5 text-accent-live" strokeWidth={1.5} />}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pair.reasons.map((reason) => <span className="hairline px-2 py-1 text-[10px] font-mono uppercase text-text-muted" key={reason}>{reason}</span>)}
      </div>
    </button>
  );
}
