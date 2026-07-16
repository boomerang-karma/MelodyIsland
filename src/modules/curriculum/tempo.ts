import type { SongTrack } from "@/modules/core";

/**
 * Speed factor for learning: 1 = original tempo, 0.5 = half speed (easier).
 * Scales note timelines so falling notes, demo, and scoring stay in sync.
 */
export function clampSpeed(speed: number): number {
  return Math.min(1.25, Math.max(0.4, speed));
}

/** Apply learning speed to a song track (stretch/compress start + duration). */
export function scaleTrackTempo(track: SongTrack, speed: number): SongTrack {
  const s = clampSpeed(speed);
  const inv = 1 / s;
  return {
    ...track,
    bpm: Math.max(40, Math.round(track.bpm * s)),
    notes: track.notes.map((n) => ({
      ...n,
      startMs: n.startMs * inv,
      durationMs: n.durationMs * inv,
    })),
  };
}

/** Kid-friendly label for a speed factor */
export function speedLabel(speed: number): string {
  const s = clampSpeed(speed);
  if (s <= 0.5) return "Super slow";
  if (s <= 0.65) return "Slow";
  if (s <= 0.8) return "Easy";
  if (s <= 0.95) return "Steady";
  if (s <= 1.05) return "Normal";
  return "Zippy";
}
