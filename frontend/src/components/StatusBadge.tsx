const dotColors: Record<string, string> = {
  Available: "bg-ink-hi shadow-[0_0_8px_rgba(245,244,240,0.4)]",
  "On Trip": "bg-status-good shadow-[0_0_8px_rgba(74,222,128,0.6)]",
  "In Shop": "bg-status-warn shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  Retired: "bg-ink-low",
  Draft: "bg-ink-low",
  Dispatched: "bg-status-good shadow-[0_0_8px_rgba(74,222,128,0.6)]",
  Completed: "bg-ink-hi shadow-[0_0_8px_rgba(245,244,240,0.4)]",
  Cancelled: "bg-ink-low",
  Open: "bg-status-warn shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  Closed: "bg-ink-hi shadow-[0_0_8px_rgba(245,244,240,0.4)]"
};

export function StatusBadge({ value }: { value: string }) {
  const color = dotColors[value] ?? "bg-ink-low";
  const isLive = value === "On Trip" || value === "Dispatched";
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink-hi bg-panel-alt border border-hairline px-2 py-1 rounded-full uppercase tracking-wider font-mono">
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${isLive ? 'animate-pulse-live' : ''}`}></span>
      {value}
    </span>
  );
}
