import { ReactNode } from "react";

export function DataTable<T>({ columns, rows }: { columns: { key: string; label: string; render: (row: T) => ReactNode }[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto glass-panel">
      <table className="min-w-full divide-y divide-border-hairline text-sm">
        <thead className="bg-bg-base text-left text-[10px] font-medium uppercase tracking-wider text-text-muted">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border-hairline">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-panel-raised transition-colors">{columns.map((column) => <td key={column.key} className="px-4 py-3">{column.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
