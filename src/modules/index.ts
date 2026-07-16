/**
 * Melody Islands module registry
 *
 * Each folder under `src/modules/` is an independently enhanceable unit.
 * Domain flow:
 *
 *   NoteInput (audio) → NoteEvent (core) → Scorer (scoring)
 *        → AttemptResult → SkillModel (skill-model)
 *        → SessionDirector (session) → next Activity (curriculum)
 *        → Companion mood + Progress snapshot
 *
 * Enhance one module without rewriting others:
 * - audio:      swap YIN → Basic Pitch / Core ML / AudioWorklet
 * - scoring:    polyphonic matching, tolerance profiles
 * - skill-model: full BKT EM, IRT, or server-side model
 * - session:    richer adaptive sequencing
 * - curriculum: new islands/songs as data only
 * - companion:  Lottie/Sprite assets
 * - progress:   Cosmos DB / Supabase adapter
 */

export * as core from "./core";
export * as curriculum from "./curriculum";
export * as audio from "./audio";
export * as scoring from "./scoring";
export * as skillModel from "./skill-model";
export * as session from "./session";
export * as companion from "./companion";
export * as progress from "./progress";

export const MODULE_MANIFEST = [
  {
    id: "core",
    path: "src/modules/core",
    responsibility: "Shared types, pitch utils, event bus",
  },
  {
    id: "curriculum",
    path: "src/modules/curriculum",
    responsibility: "Islands, activities, songs, micro-skills (content as data)",
  },
  {
    id: "audio",
    path: "src/modules/audio",
    responsibility: "Mic/MIDI/touch NoteEvent adapters + YIN DSP",
  },
  {
    id: "scoring",
    path: "src/modules/scoring",
    responsibility: "Compare NoteEvents to expected track → AttemptResult",
  },
  {
    id: "skill-model",
    path: "src/modules/skill-model",
    responsibility: "Bayesian mastery tracking + decay + spaced review",
  },
  {
    id: "session",
    path: "src/modules/session",
    responsibility: "Session director, frustration guardrail, unlock rules",
  },
  {
    id: "companion",
    path: "src/modules/companion",
    responsibility: "Companion species, XP, evolution, mood",
  },
  {
    id: "progress",
    path: "src/modules/progress",
    responsibility: "Local + API progress, parent summary, COPPA-safe profile",
  },
] as const;
