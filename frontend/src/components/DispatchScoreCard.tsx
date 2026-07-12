import { CheckCircle2, Truck } from "lucide-react";
import { RankedPair } from "../api/client";

export function DispatchScoreCard({ pair, selected, onSelect }: { pair: RankedPair; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`w-full text-left bg-panel border border-hairline rounded-lg p-4 transition-all ${selected ? "border-accent ring-1 ring-accent bg-accent-dim" : "hover:border-ink-low hover:bg-panel-alt"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-ink-hi"><Truck size={16} strokeWidth={1.5} className="text-ink-low" />{pair.vehicle.name} + {pair.driver.name}</div>
          <p className="mt-1 font-mono text-[11px] uppercase text-ink-mid tracking-wider">{pair.vehicle.reg_number} · {pair.vehicle.region ?? "Any region"} · Safety {pair.driver.safety_score}</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <p className="text-3xl font-mono text-ink-hi font-semibold">{pair.score}%</p>
          {selected && <CheckCircle2 className="h-5 w-5 text-accent" strokeWidth={1.5} />}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pair.reasons.map((reason) => <span className="border border-hairline px-2 py-1 text-[11px] font-mono uppercase text-ink-low bg-bg-deep rounded" key={reason}>{reason}</span>)}
      </div>
    </button>
  );
}
