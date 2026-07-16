/**
 * Companion creature — dances to correct rhythm, yawns if tempo drags,
 * grows/evolves with mastery. Pure presentation state; enhance with
 * SpriteKit/Lottie assets module later.
 */

import type { CompanionMood, CompanionState } from "@/modules/core";
import { bus } from "@/modules/core";

export interface CompanionSpecies {
  id: string;
  name: string;
  emojiStages: [string, string, string];
  blurb: string;
}

export const COMPANION_SPECIES: CompanionSpecies[] = [
  {
    id: "melody-moth",
    name: "Melody Moth",
    emojiStages: ["🐛", "🦋", "✨🦋"],
    blurb: "Loves soft songs and sparkly high notes.",
  },
  {
    id: "rhythm-rex",
    name: "Rhythm Rex",
    emojiStages: ["🥚", "🦕", "🦖"],
    blurb: "Stomps along to every steady beat.",
  },
  {
    id: "pixel-puffin",
    name: "Pixel Puffin",
    emojiStages: ["🥚", "🐧", "🪶🐧"],
    blurb: "Flaps wings when you play in time.",
  },
];

export function createCompanion(
  speciesId: string,
  name?: string,
): CompanionState {
  const species =
    COMPANION_SPECIES.find((s) => s.id === speciesId) ?? COMPANION_SPECIES[0];
  return {
    speciesId: species.id,
    name: name?.trim() || species.name,
    level: 1,
    xp: 0,
    mood: "curious",
    evolutionStage: 1,
  };
}

export function companionEmoji(state: CompanionState): string {
  const species =
    COMPANION_SPECIES.find((s) => s.id === state.speciesId) ??
    COMPANION_SPECIES[0];
  return species.emojiStages[state.evolutionStage - 1];
}

export function addCompanionXp(
  state: CompanionState,
  xp: number,
): CompanionState {
  let next = { ...state, xp: state.xp + xp };
  // Level every 50 XP
  while (next.xp >= next.level * 50) {
    next.xp -= next.level * 50;
    next.level += 1;
  }
  if (next.level >= 10) next.evolutionStage = 3;
  else if (next.level >= 5) next.evolutionStage = 2;
  else next.evolutionStage = 1;
  return next;
}

export function moodFromTiming(
  avgOffsetMs: number | null,
  hit: boolean,
): CompanionMood {
  if (!hit) return "curious";
  if (avgOffsetMs == null) return "happy";
  if (avgOffsetMs < 80) return "dance";
  if (avgOffsetMs > 180) return "yawn";
  return "happy";
}

export function setMood(mood: CompanionMood): void {
  bus.emit("companion:mood", { mood });
}

export const MOOD_LABELS: Record<CompanionMood, string> = {
  happy: "is smiling!",
  dance: "is dancing to your beat!",
  yawn: "yawns… maybe speed up a little?",
  cheer: "cheers for you!",
  sleep: "is resting. Great practice!",
  curious: "is listening…",
};
