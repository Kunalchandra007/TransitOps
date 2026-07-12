import { LucideIcon } from "lucide-react";

export function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="bg-panel border border-hairline rounded-lg p-4 transition-colors hover:bg-panel-alt">
      <p className="text-xs text-ink-low uppercase tracking-wider">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-3xl font-mono font-semibold text-ink-hi">{value}</p>
        <Icon className="h-5 w-5 text-ink-low opacity-50" />
      </div>
    </div>
  );
}
