import React, { useState } from "react";
import client from "../api/client";
import PriceHistoryChart from "./PriceHistoryChart.jsx";

export default function PortfolioPanel({ allocation, totalValue, totalGainLoss, onChanged }) {
  const [form, setForm] = useState({ ticker: "", quantity: "", avg_cost: "" });
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicker, setExpandedTicker] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/portfolio/holdings", form);
      setForm({ ticker: "", quantity: "", avg_cost: "" });
      onChanged();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-paper-100">Cartera</h2>
        <span
          className={`tabular text-sm ${totalGainLoss >= 0 ? "text-teal-500" : "text-brick-400"}`}
        >
          {totalGainLoss >= 0 ? "+" : ""}
          {totalGainLoss.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
        </span>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          required
          placeholder="Ticker (AAPL)"
          value={form.ticker}
          onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          className="col-span-2 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs uppercase"
        />
        <input
          type="number"
          step="0.0001"
          required
          placeholder="Cantidad"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="col-span-1 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs"
        />
        <input
          type="number"
          step="0.01"
          required
          placeholder="Coste medio"
          value={form.avg_cost}
          onChange={(e) => setForm({ ...form, avg_cost: e.target.value })}
          className="col-span-1 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs"
        />
        <button
          type="submit"
          disabled={submitting}
          className="col-span-4 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-paper-100 text-xs py-2 rounded-sm"
        >
          Añadir posición
        </button>
      </form>

      {allocation.length === 0 && (
        <p className="text-slate-500 text-sm py-6 text-center">
          Aún no tienes posiciones en cartera.
        </p>
      )}
      {allocation.map((h) => (
        <div key={h.ticker}>
          <div
            onClick={() => setExpandedTicker(expandedTicker === h.ticker ? null : h.ticker)}
            className="ledger-row flex items-center justify-between py-2 text-sm cursor-pointer hover:bg-ink-800/50"
          >
            <div>
              <p className="text-paper-100 font-mono">{h.ticker}</p>
              <p className="text-xs text-slate-500">{h.quantity} uds</p>
            </div>
            <div className="text-right">
              <p className="tabular text-paper-100">
                {h.value.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </p>
              <p
                className={`tabular text-xs ${
                  h.gain_loss >= 0 ? "text-teal-500" : "text-brick-400"
                }`}
              >
                {h.gain_loss >= 0 ? "+" : ""}
                {h.gain_loss.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          </div>
          {expandedTicker === h.ticker && <PriceHistoryChart ticker={h.ticker} />}
        </div>
      ))}
    </div>
  );
}
