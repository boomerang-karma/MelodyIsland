/**
 * Scorer: NoteEvent stream vs expected track → AttemptResult
 * Scoring uses timestamps (not real-time gating) so feedback stays fair.
 */

import {
  bus,
  pitchEquals,
  type AttemptResult,
  type ExpectedNote,
  type NoteEvent,
  type SongTrack,
} from "@/modules/core";

export interface ScorerConfig {
  /** Timing window ±ms for a hit */
  timingWindowMs: number;
  /** Allow octave errors (kids often shift register) */
  allowOctave: boolean;
  /** Kind feedback copy */
  feedback: {
    perfect: string;
    close: string;
    wrong: string;
    early: string;
    late: string;
  };
}

const DEFAULT_CONFIG: ScorerConfig = {
  timingWindowMs: 200,
  allowOctave: true,
  feedback: {
    perfect: "Yes! That was perfect! ⭐",
    close: "So close! Try the key next door.",
    wrong: "Almost! Listen again and give it another go.",
    early: "A tiny bit early — wait for the beat!",
    late: "A little late — catch the next one!",
  },
};

export class Scorer {
  private config: ScorerConfig;
  private track: SongTrack | null = null;
  private matched = new Set<number>(); // indices into track.notes
  private startWallMs = 0;
  private results: AttemptResult[] = [];
  /** When true, accept touch input for scoring (note-naming only) */
  allowTouchCredit = false;

  constructor(config: Partial<ScorerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config, feedback: { ...DEFAULT_CONFIG.feedback, ...config.feedback } };
  }

  loadTrack(track: SongTrack): void {
    this.track = track;
    this.matched.clear();
    this.results = [];
  }

  begin(wallClockStartMs = performance.now()): void {
    this.startWallMs = wallClockStartMs;
    this.matched.clear();
    this.results = [];
  }

  /** Map performance.now() relative time into song timeline */
  private songTime(onsetMs: number): number {
    return onsetMs - this.startWallMs;
  }

  process(event: NoteEvent): AttemptResult {
    if (event.source === "touch" && !this.allowTouchCredit) {
      const skip: AttemptResult = {
        noteEventId: event.id,
        hit: false,
        pitchCorrect: false,
        timingOffsetMs: null,
        feedback: "Use your real piano for this one!",
        skillIds: this.track?.skillIds ?? [],
      };
      return skip;
    }

    if (!this.track) {
      const free: AttemptResult = {
        noteEventId: event.id,
        hit: true,
        pitchCorrect: true,
        timingOffsetMs: 0,
        feedback: "Nice sound!",
        skillIds: [],
      };
      this.results.push(free);
      bus.emit("attempt:result", free);
      return free;
    }

    const t = this.songTime(event.onsetMs);
    let bestIdx = -1;
    let bestScore = Infinity;
    let bestExpected: ExpectedNote | undefined;

    this.track.notes.forEach((expected, idx) => {
      if (this.matched.has(idx)) return;
      const timing = t - expected.startMs;
      const absTiming = Math.abs(timing);
      const pitchOk = pitchEquals(event.pitch, expected.pitch, this.config.allowOctave);
      // Prefer pitch match; among matches prefer closest time
      const score = (pitchOk ? 0 : 10000) + absTiming;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = idx;
        bestExpected = expected;
      }
    });

    const timingOffsetMs =
      bestExpected != null ? t - bestExpected.startMs : null;
    const pitchCorrect =
      bestExpected != null &&
      pitchEquals(event.pitch, bestExpected.pitch, this.config.allowOctave);
    const inWindow =
      timingOffsetMs != null &&
      Math.abs(timingOffsetMs) <= this.config.timingWindowMs;
    const hit = pitchCorrect && inWindow;

    if (hit && bestIdx >= 0) {
      this.matched.add(bestIdx);
    }

    let feedback = this.config.feedback.wrong;
    if (hit) {
      feedback =
        timingOffsetMs != null && Math.abs(timingOffsetMs) < 60
          ? this.config.feedback.perfect
          : "Great job!";
    } else if (pitchCorrect && timingOffsetMs != null) {
      feedback =
        timingOffsetMs < 0
          ? this.config.feedback.early
          : this.config.feedback.late;
    } else if (bestExpected) {
      const expMidi = bestExpected.pitch.midi;
      const got = event.pitch.midi;
      if (Math.abs(expMidi - got) === 1 || Math.abs(expMidi - got) === 2) {
        feedback = this.config.feedback.close;
      }
    }

    const result: AttemptResult = {
      noteEventId: event.id,
      expected: bestExpected,
      hit,
      pitchCorrect,
      timingOffsetMs,
      feedback,
      skillIds: this.track.skillIds,
    };

    this.results.push(result);
    bus.emit("attempt:result", result);
    return result;
  }

  getProgress(): { matched: number; total: number; accuracy: number } {
    const total = this.track?.notes.length ?? 0;
    const matched = this.matched.size;
    const hits = this.results.filter((r) => r.hit).length;
    const attempts = this.results.length || 1;
    return {
      matched,
      total,
      accuracy: hits / attempts,
    };
  }

  getResults(): AttemptResult[] {
    return [...this.results];
  }

  /** Stars: 3 ≥ 90%, 2 ≥ 70%, 1 ≥ 50%, else 0 — never shaming copy */
  computeStars(): 0 | 1 | 2 | 3 {
    const { matched, total, accuracy } = this.getProgress();
    if (total === 0) return accuracy >= 0.5 ? 1 : 0;
    const coverage = matched / total;
    const score = coverage * 0.6 + accuracy * 0.4;
    if (score >= 0.9) return 3;
    if (score >= 0.7) return 2;
    if (score >= 0.45) return 1;
    return 0;
  }

  avgTimingOffsetMs(): number {
    const timed = this.results.filter((r) => r.timingOffsetMs != null && r.hit);
    if (!timed.length) return 0;
    const sum = timed.reduce((a, r) => a + Math.abs(r.timingOffsetMs!), 0);
    return Math.round(sum / timed.length);
  }
}
