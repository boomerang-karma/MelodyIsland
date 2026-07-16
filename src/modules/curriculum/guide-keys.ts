import type { SongTrack } from "@/modules/core";

/**
 * Midis the kid should press next.
 * Includes simultaneous notes (same start time) so chords light multiple keys.
 */
export function nextGuideMidis(
  track: SongTrack,
  hitIndices: Set<number>,
  chordWindowMs = 40,
): number[] {
  let first = -1;
  for (let i = 0; i < track.notes.length; i++) {
    if (!hitIndices.has(i)) {
      first = i;
      break;
    }
  }
  if (first < 0) return [];

  const t0 = track.notes[first].startMs;
  const midis: number[] = [];
  for (let i = first; i < track.notes.length; i++) {
    if (hitIndices.has(i)) continue;
    if (Math.abs(track.notes[i].startMs - t0) > chordWindowMs) break;
    midis.push(track.notes[i].pitch.midi);
  }
  // Unique midis (same pitch twice is rare)
  return [...new Set(midis)];
}
