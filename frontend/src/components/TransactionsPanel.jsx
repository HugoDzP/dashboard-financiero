import React, { useState } from "react";
import client from "../api/client";

const EXPENSE_CATEGORIES = [
  "alimentación",
  "transporte",
  "vivienda",
  "ocio",
  "salud",
  "educación",
  "compras",
  "servicios",
  "otros gastos",
];

const INCOME_CATEGORIES = ["nómina", "freelance", "inversiones", "regalo", "otros ingresos"];

const emptyForm = (type) => ({
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: type === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
  amount: "",
});

export default function TransactionsPanel({ transactions, onChanged }) {
  const [type, setType] = useState("expense"); // "expense" | "income"
  const [form, setForm] = useState(emptyForm("expense"));
  const [submitting, setSubmitting] = useState(false);
  const [csvStatus, setCsvStatus] = useState(null);

  function handleTypeChange(newType) {
    setType(newType);
    setForm(emptyForm(newType));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const signedAmount =
        type === "expense" ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount));
      await client.post("/transactions", { ...form, amount: signedAmount });
      setForm(emptyForm(type));
      onChanged();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await client.delete(`/transactions/${id}`);
    onChanged();
  }

  async function handleCategoryChange(tx, newCategory) {
    await client.patch(`/transactions/${tx.id}`, { category: newCategory });
    onChanged();
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setCsvStatus("Importando…");
    try {
      const { data: result } = await client.post("/transactions/import-csv", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCsvStatus(
        `${result.imported} movimientos importados` +
          (result.errors.length ? `, ${result.errors.length} filas con error` : "")
      );
      onChanged();
    } catch (err) {
      setCsvStatus(err.response?.data?.error || "Error al importar el CSV");
    } finally {
      e.target.value = "";
    }
  }

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-paper-100">Movimientos</h2>
        <label className="text-xs font-mono text-gold-400 hover:underline cursor-pointer">
          Importar CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
        </label>
      </div>
      {csvStatus && <p className="text-xs text-slate-400 mb-3 font-mono">{csvStatus}</p>}

      {/* Selector de tipo: fija el signo del importe automáticamente, así no hay
          que acordarse de escribir el número en negativo para un gasto. */}
      <div className="flex mb-3 border border-ink-700 rounded-sm overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex-1 py-1.5 ${
            type === "expense" ? "bg-brick-400 text-ink-950" : "text-slate-400 hover:bg-ink-700"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex-1 py-1.5 ${
            type === "income" ? "bg-teal-500 text-ink-950" : "text-slate-400 hover:bg-ink-700"
          }`}
        >
          Ingreso
        </button>
      </div>

      <form onSubmit={handleAdd} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="min-w-0 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="min-w-0 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs capitalize"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          required
          placeholder="Concepto"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs"
        />
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Importe"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="min-w-0 bg-ink-950 border border-ink-700 rounded-sm px-2 py-1.5 text-paper-100 text-xs"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-paper-100 text-xs py-2 rounded-sm"
          >
            Añadir movimiento
          </button>
        </div>
      </form>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {transactions.length === 0 && (
          <p className="text-slate-500 text-sm py-6 text-center">
            No hay movimientos todavía. Añade uno o importa un CSV.
          </p>
        )}
        {transactions.map((t) => {
          const allCategories = t.amount >= 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
          const options = allCategories.includes(t.category)
            ? allCategories
            : [t.category, ...allCategories];
          return (
            <div
              key={t.id}
              className="ledger-row flex items-center justify-between py-2 text-sm group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-paper-100 truncate">{t.description}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">{t.date} ·</span>
                  <select
                    value={t.category}
                    onChange={(e) => handleCategoryChange(t, e.target.value)}
                    className={`text-xs font-mono bg-transparent border-none capitalize cursor-pointer focus:outline-none ${
                      t.category === "sin_categorizar"
                        ? "text-gold-400 underline decoration-dotted"
                        : "text-slate-500"
                    }`}
                  >
                    {options.map((c) => (
                      <option key={c} value={c} className="bg-ink-900 text-paper-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <span
                className={`tabular text-sm mr-3 ${
                  t.amount >= 0 ? "text-teal-500" : "text-brick-400"
                }`}
              >
                {t.amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </span>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-slate-500 hover:text-brick-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                eliminar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
