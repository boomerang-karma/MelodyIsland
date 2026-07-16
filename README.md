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

### Option A — one-shot script (CLI)

```bash
brew install azure-cli   # if needed
az login
export APP_NAME=melody-islands-YOURUNIQUE
export RESOURCE_GROUP=melody-islands-rg
export LOCATION=eastus
npm run deploy:azure
```

This runs `scripts/deploy-azure.sh`: creates RG + App Service (Bicep), builds Next.js **standalone**, zip-deploys.

### Option B — GitHub Actions

1. Create the App Service (script or Portal).
2. Download the publish profile from Azure Portal → Web App → **Get publish profile**.
3. Add secret `AZURE_WEBAPP_PUBLISH_PROFILE` in GitHub.
4. Set `AZURE_WEBAPP_NAME` in `.github/workflows/azure-deploy.yml`.
5. Push to `main`.

### Option C — Docker / Container Apps

```bash
docker build -t melody-islands .
docker run -p 3000:3000 melody-islands
# then push to ACR and deploy to Azure Container Apps / App Service Web App for Containers
```

### Infrastructure as code

- `infra/main.bicep` — Linux App Service + plan  
- `infra/parameters.json` — sample parameters  

Health probe: `GET /api/health`

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
