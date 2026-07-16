/**
 * Melody Islands — Core domain types
 * Shared across all modules. Input-agnostic NoteEvent is the backbone of the architecture.
 */

export type NoteName =
  | "C"
  | "C#"
  | "D"
  | "D#"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "G#"
  | "A"
  | "A#"
  | "B";

export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Pitch {
  note: NoteName;
  octave: Octave;
  midi: number;
  frequencyHz: number;
}

/** Detected note from any input source (mic / MIDI / touch). */
export interface NoteEvent {
  id: string;
  pitch: Pitch;
  onsetMs: number;
  durationMs?: number;
  velocity: number; // 0–1
  source: "mic" | "midi" | "touch" | "synth";
  confidence: number; // 0–1
}

export type ActivityType =
  | "play_along"
  | "echo"
  | "rhythm_tap"
  | "note_naming"
  | "boss_song"
  | "free_play"
  | "calibration"
  | "remediation";

export type SkillCategory =
  | "reading"
  | "rhythm"
  | "ear"
  | "technique"
  | "hands_together"
  | "geography"
  | "dynamics";

export interface MicroSkill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  islandId: number;
}

export interface ExpectedNote {
  pitch: Pitch;
  startMs: number;
  durationMs: number;
  hand?: "left" | "right" | "either";
  finger?: 1 | 2 | 3 | 4 | 5;
}

export interface SongTrack {
  id: string;
  title: string;
  bpm: number;
  timeSignature: [number, number];
  notes: ExpectedNote[];
  /** Skills this song teaches / practices */
  skillIds: string[];
  blackKeysOnly?: boolean;
  handsTogether?: boolean;
}

export interface Activity {
  id: string;
  islandId: number;
  type: ActivityType;
  title: string;
  kidPrompt: string;
  skillIds: string[];
  songId?: string;
  starsMax: 3;
  estimatedMinutes: number;
  /** Unlock after these activity IDs (empty = available when island unlocked) */
  requires?: string[];
}

export interface Island {
  id: number;
  name: string;
  theme: string;
  emoji: string;
  color: string;
  gradient: string;
  guideName: string;
  guideEmoji: string;
  coreSkills: string[];
  bossSongId: string;
  activityIds: string[];
  unlocked: boolean;
}

export interface AttemptResult {
  noteEventId: string;
  expected?: ExpectedNote;
  hit: boolean;
  pitchCorrect: boolean;
  timingOffsetMs: number | null;
  feedback: string;
  skillIds: string[];
}

export interface ActivityResult {
  activityId: string;
  startedAt: string;
  completedAt: string;
  stars: 0 | 1 | 2 | 3;
  accuracy: number;
  avgTimingOffsetMs: number;
  attempts: AttemptResult[];
  skillDeltas: Record<string, number>;
}

export interface SkillMastery {
  skillId: string;
  /** Probability of mastery (BKT p(L)) 0–1 */
  pMastery: number;
  attempts: number;
  lastPracticedAt: string | null;
  streak: number;
}

export type CompanionMood = "happy" | "dance" | "yawn" | "cheer" | "sleep" | "curious";

export interface CompanionState {
  speciesId: string;
  name: string;
  level: number;
  xp: number;
  mood: CompanionMood;
  evolutionStage: 1 | 2 | 3;
}

export interface KidProfile {
  id: string;
  nickname: string;
  avatarEmoji: string;
  companion: CompanionState;
  createdAt: string;
}

export interface ParentSummary {
  sessionsThisWeek: number;
  totalMinutes: number;
  streakDays: number;
  noteAccuracy: number;
  avgTimingMs: number;
  skillRadar: Record<SkillCategory, number>;
  encouragement: string;
  levelProgress: { islandId: number; name: string; percent: number }[];
}

export interface SessionState {
  id: string;
  startedAt: string;
  activityQueue: string[];
  currentActivityId: string | null;
  completedActivityIds: string[];
  frustrationCount: number;
  warmUpDone: boolean;
}

export interface ProgressSnapshot {
  profile: KidProfile;
  currentIslandId: number;
  unlockedIslandIds: number[];
  activityStars: Record<string, 0 | 1 | 2 | 3>;
  skillMastery: Record<string, SkillMastery>;
  bandMembers: string[];
  stickers: string[];
  practiceFlame: number;
  totalSessions: number;
  totalMinutes: number;
  sessionHistory: {
    date: string;
    minutes: number;
    starsEarned: number;
  }[];
  bossRecordings: { activityId: string; at: string; note: string }[];
}
