/**
 * Scorer: NoteEvent stream vs expected track → AttemptResult
 *
 * Modes:
 * - performance: pitch + timing window (play-along fairness)
 * - learn: pitch-only for the next guide note(s) so glowing keys advance
 *          whenever the kid presses the right key (timing optional)
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
  /** Timing window ±ms for a hit (performance mode) */
  timingWindowMs: number;
  /** Allow octave errors (kids often shift register) */
  allowOctave: boolean;
  /**
   * learn = press the glowing key anytime → advance sequence
   * performance = must hit near the falling-note beat
   */
  mode: "learn" | "performance";
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
  mode: "learn",
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
  private matched = new Set<number>();
  private startWallMs = 0;
  private results: AttemptResult[] = [];
  allowTouchCredit = false;

  constructor(config: Partial<ScorerConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      feedback: { ...DEFAULT_CONFIG.feedback, ...config.feedback },
    };
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

  getMatchedIndices(): Set<number> {
    return new Set(this.matched);
  }

  private songTime(onsetMs: number): number {
    return onsetMs - this.startWallMs;
  }

  /** First unmatched note index (sequence order) */
  private firstUnmatchedIndex(): number {
    if (!this.track) return -1;
    for (let i = 0; i < this.track.notes.length; i++) {
      if (!this.matched.has(i)) return i;
    }
    return -1;
  }

  /**
   * Indices of the current "guide" chord (same start time as first unmatched).
   */
  private currentGuideIndices(chordWindowMs = 40): number[] {
    if (!this.track) return [];
    const first = this.firstUnmatchedIndex();
    if (first < 0) return [];
    const t0 = this.track.notes[first].startMs;
    const out: number[] = [];
    for (let i = first; i < this.track.notes.length; i++) {
      if (this.matched.has(i)) continue;
      if (Math.abs(this.track.notes[i].startMs - t0) > chordWindowMs) break;
      out.push(i);
    }
    return out;
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

    if (this.config.mode === "learn") {
      return this.processLearn(event);
    }
    return this.processPerformance(event);
  }

  /**
   * Learn mode: correct pitch for any current glowing key → hit, advance.
   * Timing is recorded but does NOT block the hit.
   */
  private processLearn(event: NoteEvent): AttemptResult {
    const track = this.track!;
    const guides = this.currentGuideIndices();
    const t = this.songTime(event.onsetMs);

    let matchIdx = -1;
    let bestExpected: ExpectedNote | undefined;

    for (const idx of guides) {
      const expected = track.notes[idx];
      if (pitchEquals(event.pitch, expected.pitch, this.config.allowOctave)) {
        matchIdx = idx;
        bestExpected = expected;
        break;
      }
    }

    // Also accept correct pitch for slightly later notes if kid skipped
    // (still sequential: only search from first unmatched forward a bit)
    if (matchIdx < 0) {
      const first = this.firstUnmatchedIndex();
      if (first >= 0) {
        for (let i = first; i < Math.min(first + 3, track.notes.length); i++) {
          if (this.matched.has(i)) continue;
          if (
            pitchEquals(event.pitch, track.notes[i].pitch, this.config.allowOctave)
          ) {
            // Only auto-skip if it's the exact next pitch chain — prefer strict next only
            if (i === first || guides.some((g) => g === i)) {
              matchIdx = i;
              bestExpected = track.notes[i];
              break;
            }
          }
        }
      }
    }

    const hit = matchIdx >= 0;
    const pitchCorrect = hit;
    const timingOffsetMs =
      bestExpected != null ? t - bestExpected.startMs : null;

    if (hit) {
      this.matched.add(matchIdx);
    }

    let feedback = this.config.feedback.wrong;
    if (hit) {
      feedback = "Yes! Next key is glowing ✨";
    } else if (guides.length > 0) {
      const want = track.notes[guides[0]].pitch;
      const delta = Math.abs(event.pitch.midi - want.midi);
      if (delta === 1 || delta === 2) {
        feedback = this.config.feedback.close;
      } else {
        feedback = `Press the glowing ${want.note}${want.octave} key!`;
      }
    }

    const result: AttemptResult = {
      noteEventId: event.id,
      expected: bestExpected,
      hit,
      pitchCorrect,
      timingOffsetMs,
      feedback,
      skillIds: track.skillIds,
    };

    this.results.push(result);
    bus.emit("attempt:result", result);
    return result;
  }

  private processPerformance(event: NoteEvent): AttemptResult {
    const t = this.songTime(event.onsetMs);
    let bestIdx = -1;
    let bestScore = Infinity;
    let bestExpected: ExpectedNote | undefined;

    this.track!.notes.forEach((expected, idx) => {
      if (this.matched.has(idx)) return;
      const timing = t - expected.startMs;
      const absTiming = Math.abs(timing);
      const pitchOk = pitchEquals(
        event.pitch,
        expected.pitch,
        this.config.allowOctave,
      );
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
      skillIds: this.track!.skillIds,
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

  computeStars(): 0 | 1 | 2 | 3 {
    const { matched, total, accuracy } = this.getProgress();
    if (total === 0) return accuracy >= 0.5 ? 1 : 0;
    // In learn mode, stars mainly track how much of the song they completed
    const coverage = matched / total;
    const score = coverage * 0.7 + accuracy * 0.3;
    if (score >= 0.9) return 3;
    if (score >= 0.7) return 2;
    if (score >= 0.45) return 1;
    return 0;
  }

  avgTimingOffsetMs(): number {
    const timed = this.results.filter(
      (r) => r.timingOffsetMs != null && r.hit,
    );
    if (!timed.length) return 0;
    const sum = timed.reduce((a, r) => a + Math.abs(r.timingOffsetMs!), 0);
    return Math.round(sum / timed.length);
  }
}
