# LastStats Frontend

The LastStats web client is a React 19 application built with Vite. It provides portfolio and SIP views, market and news pages, analytics visualizations, and the optional AI chat interface.

For the complete project overview, architecture, backend setup, and local service ports, see the [main LastStats README](../README.md).

## Run locally

From this directory:

```bash
npm ci
npm run dev
```

Vite serves the application at `http://localhost:5173` by default.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

## Environment variables

The frontend uses these optional Vite variables, each with a local default:

| Variable | Default |
| --- | --- |
| `VITE_AUTH_URL` | `http://localhost:8081` |
| `VITE_API_URL` | `http://localhost:8082` |
| `VITE_SIP_URL` | `http://localhost:8083` |
| `VITE_MARKET_URL` | `http://localhost:8084` |
| `VITE_ANALYTICS_URL` | `http://localhost:8090` |
| `VITE_GROQ_API_KEY` | Unset; enables the optional AI chat integration when configured. |

Vite exposes `VITE_*` values to browser code. Do not put private production secrets in these variables. Keep `.env.local` untracked.