import React, { useEffect, useState, useCallback } from "react";
import client from "../api/client";
import { useAuth } from "../api/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import BalanceChart from "../components/BalanceChart.jsx";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";
import TransactionsPanel from "../components/TransactionsPanel.jsx";
import PortfolioPanel from "../components/PortfolioPanel.jsx";
import Footer from "../components/Footer.jsx";

const currency = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        client.get("/dashboard/summary"),
        client.get("/transactions"),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg("No se pudo cargar el dashboard. Comprueba que el backend esté arrancado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="h-screen flex flex-col bg-ink-950 overflow-hidden">
      <header className="shrink-0 border-b border-ink-700 px-8 py-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-gold-400 uppercase">
            Análisis financiero personal
          </p>
          <h1 className="font-display text-2xl text-paper-100">Ledger</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.display_name || "Tu cuenta"}</span>
          <button
            onClick={logout}
            className="text-xs font-mono text-slate-400 hover:text-brick-400 border border-ink-700 rounded-sm px-3 py-1.5"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-6 py-3 max-w-6xl w-full mx-auto flex flex-col gap-3 overflow-hidden">
        {loading && <p className="text-slate-400 text-sm">Cargando…</p>}
        {errorMsg && <p className="text-brick-400 text-sm font-mono">{errorMsg}</p>}

        {summary && (
          <>
            <div className="shrink-0 grid grid-cols-4 gap-3">
              <StatCard
                label="Ingresos"
                value={currency(summary.personal_finance.income)}
                tone="positive"
              />
              <StatCard
                label="Gastos"
                value={currency(summary.personal_finance.expenses)}
                tone="negative"
              />
              <StatCard
                label="Balance neto"
                value={currency(summary.personal_finance.net)}
                tone={summary.personal_finance.net >= 0 ? "accent" : "negative"}
              />
              <StatCard
                label="Valor de cartera"
                value={currency(summary.portfolio.total_value)}
                hint={
                  summary.portfolio.allocation.length === 0
                    ? "aún sin posiciones"
                    : `coste: ${currency(summary.portfolio.total_cost)}`
                }
              />
            </div>

            <div className="shrink-0 grid grid-cols-3 gap-3 h-40">
              <div className="col-span-2 bg-ink-900 border border-ink-700 rounded-sm p-3 overflow-hidden">
                <h2 className="font-display text-sm text-paper-100 mb-1">
                  Evolución del balance
                </h2>
                <BalanceChart data={summary.personal_finance.balance_over_time} compact />
              </div>
              <div className="bg-ink-900 border border-ink-700 rounded-sm p-3 overflow-y-auto">
                <h2 className="font-display text-sm text-paper-100 mb-1">Gasto por categoría</h2>
                <CategoryBreakdown categories={summary.personal_finance.spending_by_category} />
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-5 gap-3">
              <div className="col-span-2 min-h-0">
                <TransactionsPanel transactions={transactions} onChanged={load} />
              </div>
              <div className="col-span-3 min-h-0">
                <PortfolioPanel
                  allocation={summary.portfolio.allocation}
                  totalValue={summary.portfolio.total_value}
                  totalGainLoss={summary.portfolio.total_gain_loss}
                  onChanged={load}
                />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
