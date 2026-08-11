import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext.jsx";

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await register(email, password, displayName);
    if (ok) navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-gold-400 uppercase">
            Análisis financiero personal
          </p>
          <h1 className="font-display text-4xl text-paper-100 mt-2">
            Crear cuenta
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ink-900 border border-ink-700 rounded-sm p-8"
        >
          <div className="mb-5">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-sm px-3 py-2 text-paper-100 text-sm focus:outline-none focus:border-gold-400"
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-sm px-3 py-2 text-paper-100 text-sm focus:outline-none focus:border-gold-400"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-sm px-3 py-2 text-paper-100 text-sm focus:outline-none focus:border-gold-400"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && (
            <p className="text-brick-400 text-sm mb-4 font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-paper-100 text-sm py-2.5 rounded-sm transition-colors"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-gold-400 hover:underline">
            Entra
          </Link>
        </p>
      </div>
    </div>
  );
}
