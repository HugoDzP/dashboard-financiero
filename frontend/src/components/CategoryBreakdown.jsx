import React from "react";

export default function CategoryBreakdown({ categories }) {
  if (!categories || categories.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No hay gastos categorizados todavía.
      </p>
    );
  }

  const max = Math.max(...categories.map((c) => c.amount));

  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <div key={c.category}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-paper-100 capitalize">{c.category}</span>
            <span className="tabular text-slate-400">
              {c.amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </span>
          </div>
          <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brick-400 rounded-full"
              style={{ width: `${Math.max(4, (c.amount / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
