# Ledger — dashboard de analítica financiera

Proyecto de portafolio: analítica de mercado (vía yfinance) + finanzas personales
(entrada manual o importación de extracto CSV), con auth multi-usuario.

## Stack

- **Backend**: Flask + PostgreSQL + SQLAlchemy + Flask-JWT-Extended + yfinance
- **Frontend**: React + Vite + Tailwind + Recharts

## Arrancar en local

### 1. Base de datos

Con Docker (recomendado):

```bash
docker compose up -d
```

Esto levanta Postgres en `localhost:5432` con la base `findash` (user/pass: `postgres`/`postgres`).

Si no usas Docker, crea la base tú mismo y ajusta `DATABASE_URL` en `backend/.env`.

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # en Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # revisa las variables, sobre todo DATABASE_URL

# Inicializar las migraciones (solo la primera vez)
export FLASK_APP=run.py
flask db init
flask db migrate -m "esquema inicial"
flask db upgrade

python run.py                   # arranca en http://localhost:5000
```

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev                     # arranca en http://localhost:5173
```

El `vite.config.js` ya tiene un proxy de `/api` hacia `http://localhost:5000`, así que
el frontend habla con el backend sin configuración extra de CORS en desarrollo.

Abre `http://localhost:5173`, crea una cuenta y ya puedes:

- Añadir movimientos manuales o importar un CSV de tu banco
- Añadir posiciones de cartera (ticker + cantidad + coste medio) y ver su valor
  actualizado en tiempo real vía yfinance
- Ver la evolución de tu balance y el desglose de gasto por categoría

## Estructura del proyecto

```
backend/
  app/
    models/        # User, Transaction, Holding, WatchlistItem
    auth/           # registro, login, refresh
    api/            # transactions (+ import CSV), market (yfinance), portfolio, dashboard
    config.py
    extensions.py
  run.py
frontend/
  src/
    api/            # cliente axios + contexto de auth
    components/      # StatCard, BalanceChart, CategoryBreakdown, TransactionsPanel, PortfolioPanel
    pages/           # Login, Register, Dashboard
docker-compose.yml  # Postgres local
```

## Tests

Backend (pytest, usa SQLite en memoria — no toca tu Postgres real):

```bash
cd backend
pytest tests/ -v
```

Frontend (vitest):

```bash
cd frontend
npm run test
```

## Despliegue

Arquitectura elegida: backend + Postgres en **Railway**, frontend en **Vercel**,
con dos subdominios de `diazperulero.com` (mismo patrón que `go.diazperulero.com`
del acortador de URLs):

- `ledger.diazperulero.com` → frontend (Vercel)
- `ledger-api.diazperulero.com` → backend (Railway)

Pasos:

1. Sube el repo a GitHub si no lo has hecho.
2. **Railway**: New Project → Deploy from GitHub repo → carpeta `backend/`. Añade un
   servicio de PostgreSQL en el mismo proyecto (te inyecta `DATABASE_URL` solo).
   En Variables, añade `SECRET_KEY`, `JWT_SECRET_KEY` (nuevas, no las de `.env.example`)
   y `CORS_ORIGINS=https://ledger.diazperulero.com`.
3. **Vercel**: importa el mismo repo, Root Directory = `frontend`. Añade la variable
   `VITE_API_URL=https://ledger-api.diazperulero.com`.
4. **DNS**: dos CNAME en tu proveedor — `ledger` → dominio de Vercel, `ledger-api` →
   dominio de Railway.
5. Con el backend ya desplegado, corre `flask db upgrade` una vez contra la base de
   datos de producción (Railway te deja abrir una terminal sobre el servicio).

## Pendiente / siguientes pasos

- [ ] Completar el despliegue en Railway + Vercel + DNS (pasos de arriba)
