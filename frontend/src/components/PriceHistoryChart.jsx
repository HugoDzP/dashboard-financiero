import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import client from "../api/client";

const PERIODS = [
  { value: "1mo", label: "1M" },
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1A" },
  { value: "5y", label: "5A" },
];

export default function PriceHistoryChart({ ticker }) {
  const [period, setPeriod] = useState("6mo");
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    client
      .get(`/market/history/${ticker}`, { params: { period } })
      .then(({ data }) => {
        if (!cancelled) setPoints(data.points);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "No se pudo cargar el histórico");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, period]);

  return (
    <div className="bg-ink-950 border border-ink-700 rounded-sm p-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono text-slate-400">{ticker} · precio de cierre</p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                period === p.value
                  ? "bg-gold-400 text-ink-950"
                  : "text-slate-500 hover:text-paper-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-slate-500 text-xs py-10 text-center">Cargando…</p>}
      {error && <p className="text-brick-400 text-xs py-10 text-center font-mono">{error}</p>}

      {!loading && !error && points && points.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#233257" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8B93A7", fontSize: 10 }}
              axisLine={{ stroke: "#233257" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#8B93A7", fontSize: 10 }}
              axisLine={{ stroke: "#233257" }}
              tickLine={false}
              width={48}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "#101A2E",
                border: "1px solid #233257",
                borderRadius: 2,
                fontSize: 12,
              }}
              labelStyle={{ color: "#F7F4EC" }}
            />
            <Line type="monotone" dataKey="close" stroke="#0F5E56" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
