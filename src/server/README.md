# Optional server APIs (App Service only)

These Next.js route handlers lived under `src/app/api/*` but **Azure Static Web Apps** deploys a static export (`out/`), which cannot include App Router API routes.

Progress is already stored in the browser (`localStorage`). Cloud sync needs either:

1. **Azure App Service** — move these folders back to `src/app/api/` and build with `BUILD_TARGET=appservice`, or  
2. **Azure Functions** under SWA’s `/api` folder (Node functions), wired to the same JSON shapes.

Contents:

- `api-routes/health` — health check  
- `api-routes/progress` — progress sync  
- `api-routes/curriculum` — curriculum JSON export  
