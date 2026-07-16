import { parsePitch } from "@/modules/core";
import type { ExpectedNote, SongTrack } from "@/modules/core";

function n(
  label: string,
  startBeat: number,
  durationBeats: number,
  bpm: number,
  hand: "left" | "right" | "either" = "either",
  finger?: 1 | 2 | 3 | 4 | 5,
): ExpectedNote {
  const beatMs = 60000 / bpm;
  return {
    pitch: parsePitch(label),
    startMs: startBeat * beatMs,
    durationMs: durationBeats * beatMs,
    hand,
    finger,
  };
}

/** Content as data — ship new songs without app updates. */
export const SONGS: SongTrack[] = [
  {
    id: "jungle-beat",
    title: "Jungle Beat",
    bpm: 80,
    timeSignature: [4, 4],
    skillIds: ["geo-black-2", "geo-black-3", "rhythm-steady-beat"],
    blackKeysOnly: true,
    notes: [
      n("C#4", 0, 1, 80, "right", 2),
      n("D#4", 1, 1, 80, "right", 3),
      n("C#4", 2, 1, 80, "right", 2),
      n("D#4", 3, 1, 80, "right", 3),
      n("F#4", 4, 1, 80, "right", 2),
      n("G#4", 5, 1, 80, "right", 3),
      n("A#4", 6, 1, 80, "right", 4),
      n("G#4", 7, 1, 80, "right", 3),
      n("C#4", 8, 2, 80, "right", 2),
      n("D#4", 10, 2, 80, "right", 3),
      n("F#4", 12, 4, 80, "right", 2),
    ],
  },
  {
    id: "c-is-for-castle",
    title: "C is for Castle",
    bpm: 90,
    timeSignature: [4, 4],
    skillIds: ["read-white-keys-ag", "geo-middle-c", "rhythm-quarter"],
    notes: [
      n("C4", 0, 1, 90, "right", 1),
      n("D4", 1, 1, 90, "right", 2),
      n("E4", 2, 1, 90, "right", 3),
      n("C4", 3, 1, 90, "right", 1),
      n("E4", 4, 1, 90, "right", 3),
      n("D4", 5, 1, 90, "right", 2),
      n("C4", 6, 2, 90, "right", 1),
      n("G4", 8, 1, 90, "right", 5),
      n("E4", 9, 1, 90, "right", 3),
      n("D4", 10, 1, 90, "right", 2),
      n("C4", 11, 1, 90, "right", 1),
      n("C4", 12, 4, 90, "right", 1),
    ],
  },
  {
    id: "ode-to-joy-rh",
    title: "Ode to Joy",
    bpm: 100,
    timeSignature: [4, 4],
    skillIds: ["tech-c-position-rh", "read-prestaff", "rhythm-quarter"],
    notes: [
      n("E4", 0, 1, 100, "right", 3),
      n("E4", 1, 1, 100, "right", 3),
      n("F4", 2, 1, 100, "right", 4),
      n("G4", 3, 1, 100, "right", 5),
      n("G4", 4, 1, 100, "right", 5),
      n("F4", 5, 1, 100, "right", 4),
      n("E4", 6, 1, 100, "right", 3),
      n("D4", 7, 1, 100, "right", 2),
      n("C4", 8, 1, 100, "right", 1),
      n("C4", 9, 1, 100, "right", 1),
      n("D4", 10, 1, 100, "right", 2),
      n("E4", 11, 1, 100, "right", 3),
      n("E4", 12, 1.5, 100, "right", 3),
      n("D4", 13.5, 0.5, 100, "right", 2),
      n("D4", 14, 2, 100, "right", 2),
    ],
  },
  {
    id: "warm-up-cde",
    title: "C-D-E Warm-up",
    bpm: 80,
    timeSignature: [4, 4],
    skillIds: ["geo-middle-c", "rhythm-quarter"],
    notes: [
      n("C4", 0, 1, 80, "right", 1),
      n("D4", 1, 1, 80, "right", 2),
      n("E4", 2, 1, 80, "right", 3),
      n("D4", 3, 1, 80, "right", 2),
      n("C4", 4, 2, 80, "right", 1),
    ],
  },
  {
    id: "black-key-hop",
    title: "Black Key Hop",
    bpm: 70,
    timeSignature: [4, 4],
    skillIds: ["geo-black-2", "geo-black-3"],
    blackKeysOnly: true,
    notes: [
      n("F#4", 0, 1, 70),
      n("G#4", 1, 1, 70),
      n("A#4", 2, 1, 70),
      n("G#4", 3, 1, 70),
      n("F#4", 4, 2, 70),
      n("C#4", 6, 1, 70),
      n("D#4", 7, 1, 70),
      n("C#4", 8, 2, 70),
    ],
  },
  {
    id: "twinkle-snippet",
    title: "Twinkle Snippet",
    bpm: 90,
    timeSignature: [4, 4],
    skillIds: ["tech-c-position-rh", "read-prestaff"],
    notes: [
      n("C4", 0, 1, 90, "right", 1),
      n("C4", 1, 1, 90, "right", 1),
      n("G4", 2, 1, 90, "right", 5),
      n("G4", 3, 1, 90, "right", 5),
      n("A4", 4, 1, 90, "right", 5),
      n("A4", 5, 1, 90, "right", 5),
      n("G4", 6, 2, 90, "right", 5),
    ],
  },
];

export function getCurriculumSong(id: string): SongTrack | undefined {
  return SONGS.find((s) => s.id === id);
}
