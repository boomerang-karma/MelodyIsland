# Melody Islands 🏝️🎹

**Piano learning adventure for kids (~age 7)** — modular web app (iPad-first PWA) implementing the product vision in [`piano-app-build-plan.md`](./piano-app-build-plan.md).

Kid surface: island map, companion, play-along / echo / rhythm / boss songs, free play.  
Parent surface: gated dashboard with streaks, skill radar, mastery heatmap, encouragement copy.

> Native Swift/SpriteKit remains the long-term iPad latency path from the plan. This repo ships a **modular TypeScript implementation** you can enhance module-by-module and **deploy on Azure** today. Modules mirror the plan’s event-driven architecture so a native client can reuse the same domain contracts later.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/onboarding` | Nickname + avatar + companion (no PII) |
| `/play` | World map (10 islands) |
| `/play/island/[id]` | Activities for an island |
| `/play/island/[id]/activity/[id]` | Activity player |
| `/free-play` | Always-on sandbox + optional drums |
| `/parent` | Parental-gate + metrics |
| `/api/health` | Health check |
| `/api/progress` | Progress sync (in-memory; swap DB later) |
| `/api/curriculum` | Content-as-data export |

---

## Modular architecture

```
NoteInput (audio) → NoteEvent (core) → Scorer (scoring)
     → AttemptResult → SkillModel (skill-model)
     → SessionDirector (session) → Activity (curriculum)
     → Companion + Progress
```

| Module | Path | Enhance by… |
|--------|------|-------------|
| **core** | `src/modules/core` | Shared types, pitch math, event bus |
| **curriculum** | `src/modules/curriculum` | Add islands/songs/skills as data only |
| **audio** | `src/modules/audio` | Replace YIN with Basic Pitch / AudioWorklet / MIDI polish |
| **scoring** | `src/modules/scoring` | Polyphonic matching, calibration tolerances |
| **skill-model** | `src/modules/skill-model` | Full BKT EM / server model |
| **session** | `src/modules/session` | Smarter adaptive queues, remediation games |
| **companion** | `src/modules/companion` | Lottie/Sprite evolution art |
| **progress** | `src/modules/progress` | Cosmos DB / Postgres adapter |

See `src/modules/index.ts` for the registry.

### Curriculum status (plan Phase 1 MVP + scaffolding)

- **Islands 1–3 fully playable** (Drum Jungle, Letter Beach, Five-Finger Cove)
- **Islands 4–10** mapped on the world UI with “coming soon” activity slots
- Boss songs unlock the next island + recruit a band member

---

## Azure deployment

### Option A — Azure Static Web Apps (recommended for this repo)

The app ships as a **Next.js static export** into the `out/` folder.

> **Not `build`.** Oryx defaults (React/CRA) look for `build/` and fail with:
> `The app build failed to produce artifact folder: 'build'`.

#### Portal settings (if you linked GitHub in Deployment Center)

| Setting | Value |
|--------|--------|
| App location | `/` |
| Api location | *(empty)* |
| **Output location** | **`out`** ← change from `build` |
| Build command (optional) | `npm run build` |

Or use the workflow in `.github/workflows/azure-static-web-apps.yml`:

1. Portal → Static Web App → **Manage deployment token** → copy token.  
2. GitHub → repo **Settings → Secrets and variables → Actions** → new secret:  
   `AZURE_STATIC_WEB_APPS_API_TOKEN` = that token.  
3. Push to `main` (or re-run the workflow).

Local check:

```bash
npm run build:swa
ls out   # must exist
```

### Option B — Azure App Service (Node, full server)

```bash
az login
export APP_NAME=your-app-name
export RESOURCE_GROUP=your-rg
export LOCATION=eastus
npm run build:appservice
# then scripts/deploy-azure.sh or zip deploy of .next/standalone
```

Restore API routes from `src/server/api-routes/` into `src/app/api/` if you need `/api/progress` again.

### Option C — Docker

```bash
# Dockerfile expects standalone build
BUILD_TARGET=appservice npm run build:appservice
docker build -t melody-islands .
```

### Infrastructure as code

- `infra/main.bicep` — Linux App Service + plan  
- `staticwebapp.config.json` / `public/staticwebapp.config.json` — SWA routes

---

## Design principles (from the plan)

- Sessions **5–10 minutes**, end on a win  
- Kind feedback (“so close! try the key next door”)  
- Real instrument via mic; on-screen keys for naming games  
- Kid sees stars/companion; parent sees accuracy, timing, skill radar  
- COPPA-minded profiles (nickname + avatar only)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (standalone) |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run deploy:azure` | Build + deploy to Azure |

---

## License

Private / educational project scaffold. Pedagogy inspired by standard beginner progressions (Faber / Bastien-style sequence described in the build plan).
