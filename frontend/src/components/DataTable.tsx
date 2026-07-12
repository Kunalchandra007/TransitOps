import { ReactNode } from "react";

export function DataTable<T>({ columns, rows }: { columns: { key: string; label: string; render: (row: T) => ReactNode }[]; rows: T[] }) {
  return (
    <div className="overflow-x-auto bg-panel border border-hairline rounded-lg">
      <table className="min-w-full divide-y divide-hairline text-sm">
        <thead className="bg-panel-alt text-left text-[11px] font-mono font-semibold uppercase tracking-wider text-ink-low border-b border-hairline">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-panel-alt transition-colors text-ink-hi">{columns.map((column) => <td key={column.key} className="px-4 py-3">{column.render(row)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
