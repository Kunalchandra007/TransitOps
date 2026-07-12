const dotColors: Record<string, string> = {
  green: "bg-accent-live dot-live",
  yellow: "bg-accent-signal",
  red: "bg-rose-500 dot-alert"
};

const borderColors: Record<string, string> = {
  green: "border-l-accent-live",
  yellow: "border-l-accent-signal",
  red: "border-l-rose-500"
};

export function FleetHealthGrid({ items }: { items: { vehicle_id: string; name: string; reg_number: string; color: string; flags: string[] }[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.vehicle_id} className={`glass-panel border-l-2 p-4 ${borderColors[item.color] ?? borderColors.green}`}>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotColors[item.color] ?? dotColors.green}`}></span>
            <p className="text-sm font-semibold text-text-primary">{item.name}</p>
          </div>
          <p className="mt-1 font-mono text-[10px] text-text-muted">{item.reg_number}</p>
          <p className="mt-3 text-xs text-text-muted">{item.flags.length ? item.flags.join(", ") : "Healthy"}</p>
        </div>
      ))}
    </div>
  );
}
