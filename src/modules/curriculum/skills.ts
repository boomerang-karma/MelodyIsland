import type { MicroSkill } from "@/modules/core";

/** Micro-skills are the atomic unit of the adaptive engine. */
export const MICRO_SKILLS: MicroSkill[] = [
  // Island 1 — Drum Jungle
  {
    id: "geo-black-2",
    name: "Find 2-black-key groups",
    category: "geography",
    description: "Locate groups of two black keys on the keyboard",
    islandId: 1,
  },
  {
    id: "geo-black-3",
    name: "Find 3-black-key groups",
    category: "geography",
    description: "Locate groups of three black keys",
    islandId: 1,
  },
  {
    id: "tech-finger-numbers",
    name: "Finger numbers 1–5",
    category: "technique",
    description: "Use correct finger numbers when prompted",
    islandId: 1,
  },
  {
    id: "geo-high-low",
    name: "High vs low sounds",
    category: "ear",
    description: "Identify higher and lower pitches",
    islandId: 1,
  },
  {
    id: "dyn-loud-soft",
    name: "Loud and soft",
    category: "dynamics",
    description: "Play forte and piano on request",
    islandId: 1,
  },
  {
    id: "rhythm-steady-beat",
    name: "Steady beat tap",
    category: "rhythm",
    description: "Tap a steady quarter-note beat ±80ms",
    islandId: 1,
  },
  // Island 2 — Letter Beach
  {
    id: "read-white-keys-ag",
    name: "White key names A–G",
    category: "reading",
    description: "Name white keys A through G on sight <2s",
    islandId: 2,
  },
  {
    id: "geo-middle-c",
    name: "Middle C home base",
    category: "geography",
    description: "Find and return to Middle C",
    islandId: 2,
  },
  {
    id: "rhythm-quarter",
    name: "Quarter notes",
    category: "rhythm",
    description: "Play quarter notes at target tempo",
    islandId: 2,
  },
  {
    id: "rhythm-half-whole",
    name: "Half & whole notes",
    category: "rhythm",
    description: "Hold half and whole notes for full duration",
    islandId: 2,
  },
  // Island 3 — Five-Finger Cove
  {
    id: "tech-c-position-rh",
    name: "RH C-position",
    category: "technique",
    description: "Play five-finger melodies in RH C position",
    islandId: 3,
  },
  {
    id: "read-prestaff",
    name: "Pre-staff notation",
    category: "reading",
    description: "Follow pre-staff finger/note charts",
    islandId: 3,
  },
  {
    id: "tech-lh-intro",
    name: "Left hand intro",
    category: "technique",
    description: "Play simple LH patterns",
    islandId: 3,
  },
  // Island 4+ scaffolding
  {
    id: "read-guide-notes",
    name: "Guide notes C/G/F",
    category: "reading",
    description: "Read Middle C, Treble G, Bass F",
    islandId: 4,
  },
  {
    id: "read-steps-skips",
    name: "Steps and skips",
    category: "reading",
    description: "Identify steps vs skips on staff",
    islandId: 5,
  },
  {
    id: "hands-simple-together",
    name: "Simple hands together",
    category: "hands_together",
    description: "Coordinate both hands on simple pieces",
    islandId: 6,
  },
  {
    id: "read-sharps-flats",
    name: "First sharps & flats",
    category: "reading",
    description: "Play G position with accidentals",
    islandId: 7,
  },
  {
    id: "tech-triads",
    name: "C F G triads",
    category: "technique",
    description: "Play broken and blocked triads",
    islandId: 8,
  },
  {
    id: "tech-scales-cg",
    name: "C & G scales",
    category: "technique",
    description: "Play one-octave C and G scales",
    islandId: 9,
  },
  {
    id: "tech-expression",
    name: "Musical expression",
    category: "technique",
    description: "Apply dynamics and phrasing in full pieces",
    islandId: 10,
  },
];

export function getSkill(id: string): MicroSkill | undefined {
  return MICRO_SKILLS.find((s) => s.id === id);
}

export function skillsForIsland(islandId: number): MicroSkill[] {
  return MICRO_SKILLS.filter((s) => s.islandId === islandId);
}
