import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function BalanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-16 text-center">
        Aún no hay movimientos para dibujar la evolución del balance.
      </p>
    );
  }

  if (data.length < 3) {
    return (
      <p className="text-slate-500 text-sm py-16 text-center">
        Añade más movimientos para ver la evolución del balance en el tiempo.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#233257" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8B93A7", fontSize: 11 }}
          axisLine={{ stroke: "#233257" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8B93A7", fontSize: 11 }}
          axisLine={{ stroke: "#233257" }}
          tickLine={false}
          width={56}
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
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#C9A15A"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
