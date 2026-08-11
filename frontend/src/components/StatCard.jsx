import React from "react";

const toneClasses = {
  positive: "text-teal-500",
  negative: "text-brick-400",
  neutral: "text-paper-100",
  accent: "text-gold-400",
};

export default function StatCard({ label, value, tone = "neutral", hint }) {
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-sm p-5">
      <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`tabular text-2xl ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
