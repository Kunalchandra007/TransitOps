const dotColors: Record<string, string> = {
  Available: "bg-text-primary",
  "On Trip": "bg-accent-live",
  "In Shop": "bg-accent-signal",
  Retired: "bg-text-muted",
  Draft: "bg-text-muted",
  Dispatched: "bg-accent-live",
  Completed: "bg-text-primary",
  Cancelled: "bg-text-muted",
  Open: "bg-accent-signal",
  Closed: "bg-text-primary"
};

export function StatusBadge({ value }: { value: string }) {
  const color = dotColors[value] ?? "bg-text-muted";
  const isLive = value === "On Trip";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary">
      <span className={`h-2 w-2 rounded-full ${color} ${isLive ? 'animate-pulse-live dot-live' : ''} ${value === 'In Shop' || value === 'Open' ? 'dot-alert' : ''}`}></span>
      {value}
    </span>
  );
}
