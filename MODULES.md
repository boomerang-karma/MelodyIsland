# Module enhancement guide

Work **one module at a time**. Contracts live in `src/modules/core/types.ts`.

## Suggested enhancement order

1. **curriculum** — author more songs (`songs.ts`) and wire activities (`islands.ts`). No code changes in audio/scoring required if you only add data.
2. **audio** — replace `ScriptProcessor` with `AudioWorklet`; improve onset detection; calibration ritual UI.
3. **scoring** — phrase-level retries; hand isolation mode; sheet-music toggle metadata.
4. **skill-model** — per-skill BKT parameter fitting from logged attempts.
5. **session** — spaced review warm-ups drawn from `decayingSkills()`; auto remediation activities.
6. **companion** — visual assets + animation states driven by `CompanionMood`.
7. **progress** — persist `POST /api/progress` to Azure Cosmos DB / PostgreSQL; parent auth.

## Event bus

```ts
import { bus } from "@/modules/core";

bus.on("note:detected", (e) => { /* … */ });
bus.on("attempt:result", (r) => { /* … */ });
bus.on("activity:completed", (r) => { /* … */ });
```

## Input adapter pattern

```ts
MicNoteInput | MidiNoteInput | TouchNoteInput  →  NoteEvent  →  Scorer
```

Never couple UI directly to Web Audio internals — go through `NoteInput`.

## Content as data

Songs and activities are plain objects. Future: load from `/api/curriculum` or CMS JSON without shipping a new binary for every tune.
