import { LucideIcon } from "lucide-react";

export function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-3xl font-mono kpi-value">{value}</p>
        <Icon className="h-4 w-4 text-text-muted opacity-50" />
      </div>
    </div>
  );
}
