const dotColors: Record<string, string> = {
  green: "bg-status-good shadow-[0_0_8px_rgba(74,222,128,0.6)]",
  yellow: "bg-status-warn shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  red: "bg-status-bad shadow-[0_0_8px_rgba(248,113,113,0.6)]"
};

const borderColors: Record<string, string> = {
  green: "border-l-status-good",
  yellow: "border-l-status-warn",
  red: "border-l-status-bad"
};

export function FleetHealthGrid({ items }: { items: { vehicle_id: string; name: string; reg_number: string; color: string; flags: string[] }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.vehicle_id} className={`bg-panel border border-hairline border-l-4 p-4 rounded-lg transition-colors hover:bg-panel-alt ${borderColors[item.color] ?? borderColors.green}`}>
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColors[item.color] ?? dotColors.green}`}></span>
            <p className="text-sm font-semibold text-ink-hi truncate">{item.name}</p>
          </div>
          <p className="mt-2 font-mono text-[11px] text-ink-low uppercase tracking-wider">{item.reg_number}</p>
          <p className="mt-3 text-xs text-ink-mid line-clamp-2">{item.flags.length ? item.flags.join(", ") : "Healthy"}</p>
        </div>
      ))}
    </div>
  );
}
