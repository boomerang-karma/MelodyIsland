"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Activity, ActivityResult, AttemptResult, CompanionMood } from "@/modules/core";
import { pitchLabel } from "@/modules/core";
import { getSong } from "@/modules/curriculum";
import { MicNoteInput, TouchNoteInput, playTone } from "@/modules/audio";
import { Scorer } from "@/modules/scoring";
import { moodFromTiming } from "@/modules/companion";
import { CompanionBubble } from "./CompanionBubble";
import { FallingNotes } from "./FallingNotes";
import { PianoKeyboard } from "./PianoKeyboard";
import { Button } from "./ui/Button";
import type { CompanionState } from "@/modules/core";

interface Props {
  activity: Activity;
  companion: CompanionState;
  onComplete: (result: ActivityResult) => void;
  onExit: () => void;
}

export function ActivityPlayer({ activity, companion, onComplete, onExit }: Props) {
  const song = activity.songId ? getSong(activity.songId) : undefined;
  const scorerRef = useRef(new Scorer());
  const micRef = useRef<MicNoteInput | null>(null);
  const touchRef = useRef<TouchNoteInput | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const missStreak = useRef(0);

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState(activity.kidPrompt);
  const [lastMidi, setLastMidi] = useState<number | null>(null);
  const [hitIndices, setHitIndices] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ matched: 0, total: 0, accuracy: 0 });
  const [mood, setMood] = useState<CompanionMood>("curious");
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [useTouch, setUseTouch] = useState(
    activity.type === "note_naming" || activity.type === "free_play",
  );
  const [namingTarget, setNamingTarget] = useState<number>(60);
  const [namingScore, setNamingScore] = useState({ correct: 0, total: 0 });
  const [rhythmBeats, setRhythmBeats] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const isNaming = activity.type === "note_naming";
  const isRhythm = activity.type === "rhythm_tap";
  const isFree = activity.type === "free_play";

  const handleNote = useCallback(
    (event: Parameters<MicNoteInput["onNote"] extends (h: infer H) => unknown ? H : never>[0]) => {
      setLastMidi(event.pitch.midi);
      playTone(event.pitch.frequencyHz, 120, 0.08);

      if (isNaming) {
        const ok = event.pitch.midi === namingTarget || event.pitch.note === "C";
        // For finger/note games: accept correct midi
        const correct =
          activity.id.includes("finger") ||
          Math.abs(event.pitch.midi - namingTarget) === 0 ||
          (activity.id.includes("middle-c") && event.pitch.midi === 60);
        setNamingScore((s) => {
          const next = {
            correct: s.correct + (correct ? 1 : 0),
            total: s.total + 1,
          };
          if (next.total >= 8) {
            finishNaming(next);
          } else if (correct) {
            // next target
            const pool = [60, 62, 64, 65, 67, 69, 71];
            setNamingTarget(pool[Math.floor(Math.random() * pool.length)]);
          }
          return next;
        });
        setFeedback(
          correct
            ? "Yes! You found it! ⭐"
            : `So close! Look for ${pitchLabel({ ...event.pitch, midi: namingTarget, note: requirePitch(namingTarget) })}`,
        );
        setMood(correct ? "cheer" : "curious");
        void ok;
        return;
      }

      if (isRhythm) {
        setRhythmBeats((b) => {
          const next = b + 1;
          setFeedback(next % 4 === 0 ? "Steady beat — you're a drum jungle pro!" : "Keep tapping!");
          setMood(next % 4 === 0 ? "dance" : "happy");
          if (next >= 16) finishRhythm(next);
          return next;
        });
        return;
      }

      if (isFree) {
        setFeedback(`I hear ${pitchLabel(event.pitch)}!`);
        setMood("dance");
        return;
      }

      const result = scorerRef.current.process(event);
      applyAttempt(result);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNaming, isRhythm, isFree, namingTarget, activity.id],
  );

  function requirePitch(midi: number) {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
    return names[((midi % 12) + 12) % 12];
  }

  function applyAttempt(result: AttemptResult) {
    setFeedback(result.feedback);
    setMood(
      moodFromTiming(
        result.timingOffsetMs != null ? Math.abs(result.timingOffsetMs) : null,
        result.hit,
      ),
    );
    if (result.hit && result.expected) {
      missStreak.current = 0;
      setHitIndices((prev) => {
        const next = new Set(prev);
        // find index by startMs match
        if (song) {
          const idx = song.notes.findIndex(
            (n) =>
              n.startMs === result.expected!.startMs &&
              n.pitch.midi === result.expected!.pitch.midi,
          );
          if (idx >= 0) next.add(idx);
        }
        return next;
      });
    } else {
      missStreak.current += 1;
    }
    setProgress(scorerRef.current.getProgress());
    const { matched, total } = scorerRef.current.getProgress();
    if (total > 0 && matched >= total) {
      finishSong();
    }
  }

  function finishSong() {
    setPlaying(false);
    const s = scorerRef.current.computeStars();
    setStars(s);
    setPhase("done");
    setMood("cheer");
    const attempts = scorerRef.current.getResults();
    const skillDeltas: Record<string, number> = {};
    activity.skillIds.forEach((id) => {
      skillDeltas[id] = s >= 1 ? 1 : -0.2;
    });
    onComplete({
      activityId: activity.id,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      stars: s,
      accuracy: scorerRef.current.getProgress().accuracy,
      avgTimingOffsetMs: scorerRef.current.avgTimingOffsetMs(),
      attempts,
      skillDeltas,
    });
  }

  function finishNaming(score: { correct: number; total: number }) {
    setPlaying(false);
    const ratio = score.correct / Math.max(1, score.total);
    const s: 0 | 1 | 2 | 3 = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.45 ? 1 : 0;
    setStars(s);
    setPhase("done");
    const skillDeltas: Record<string, number> = {};
    activity.skillIds.forEach((id) => {
      skillDeltas[id] = s >= 1 ? 1 : -0.2;
    });
    onComplete({
      activityId: activity.id,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      stars: s,
      accuracy: ratio,
      avgTimingOffsetMs: 0,
      attempts: [],
      skillDeltas,
    });
  }

  function finishRhythm(beats: number) {
    setPlaying(false);
    const s: 0 | 1 | 2 | 3 = beats >= 16 ? 3 : beats >= 12 ? 2 : beats >= 8 ? 1 : 0;
    setStars(s);
    setPhase("done");
    const skillDeltas: Record<string, number> = {};
    activity.skillIds.forEach((id) => {
      skillDeltas[id] = 1;
    });
    onComplete({
      activityId: activity.id,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      stars: s,
      accuracy: 1,
      avgTimingOffsetMs: 80,
      attempts: [],
      skillDeltas,
    });
  }

  async function startPlay() {
    startedAt.current = new Date().toISOString();
    setPhase("play");
    setHitIndices(new Set());
    setElapsedMs(0);
    missStreak.current = 0;

    if (song) {
      scorerRef.current.loadTrack(song);
      scorerRef.current.allowTouchCredit = useTouch;
      scorerRef.current.begin(performance.now());
      setProgress({ matched: 0, total: song.notes.length, accuracy: 0 });
    }

    if (isNaming) {
      setNamingTarget(60);
      setNamingScore({ correct: 0, total: 0 });
    }
    if (isRhythm) setRhythmBeats(0);

    touchRef.current = new TouchNoteInput();
    await touchRef.current.start();
    touchRef.current.onNote(handleNote);

    if (!useTouch) {
      try {
        micRef.current = new MicNoteInput();
        await micRef.current.start();
        micRef.current.onNote(handleNote);
        setMicError(null);
      } catch {
        setMicError("Mic unavailable — using on-screen piano. Plug in MIDI later for best results.");
        setUseTouch(true);
        scorerRef.current.allowTouchCredit = true;
      }
    }

    setPlaying(true);
    setFeedback(activity.kidPrompt);
  }

  useEffect(() => {
    return () => {
      micRef.current?.stop();
      touchRef.current?.stop();
    };
  }, []);

  // Demo auto-complete free play after user explores
  function completeFreePlay() {
    setPlaying(false);
    setStars(2);
    setPhase("done");
    const skillDeltas: Record<string, number> = {};
    activity.skillIds.forEach((id) => {
      skillDeltas[id] = 1;
    });
    onComplete({
      activityId: activity.id,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      stars: 2,
      accuracy: 1,
      avgTimingOffsetMs: 0,
      attempts: [],
      skillDeltas,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest">
            {activity.type.replace("_", " ")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{activity.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Leave gently ✕
        </Button>
      </div>

      <CompanionBubble companion={companion} mood={mood} />

      <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white text-lg">
        {feedback}
      </div>

      {micError && (
        <p className="text-amber-200 text-sm bg-amber-500/20 rounded-xl px-3 py-2">{micError}</p>
      )}

      {phase === "intro" && (
        <div className="space-y-4">
          <p className="text-white/80 text-sm">
            Sessions are short and end on a win. Use a real piano with the mic when you can —
            the on-screen keys are great for note games.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={startPlay} size="lg">
              Let&apos;s play! 🎵
            </Button>
            <Button
              variant="secondary"
              onClick={() => setUseTouch((v) => !v)}
            >
              Input: {useTouch ? "On-screen" : "Microphone"}
            </Button>
          </div>
        </div>
      )}

      {phase === "play" && (
        <div className="space-y-4">
          {song && !isNaming && !isRhythm && (
            <FallingNotes
              track={song}
              playing={playing}
              elapsedMs={elapsedMs}
              hitIndices={hitIndices}
            />
          )}

          {isNaming && (
            <div className="text-center py-6 rounded-2xl bg-violet-500/20 border border-violet-300/30">
              <p className="text-white/70 text-sm">Find this key</p>
              <p className="text-5xl font-black text-white mt-2">
                {pitchLabel({
                  note: requirePitch(namingTarget),
                  octave: (Math.floor(namingTarget / 12) - 1) as 0,
                  midi: namingTarget,
                  frequencyHz: 0,
                })}
              </p>
              <p className="text-white/60 text-sm mt-2">
                Score {namingScore.correct}/{namingScore.total} (goal 8)
              </p>
            </div>
          )}

          {isRhythm && (
            <div className="text-center py-8 rounded-2xl bg-emerald-500/20 border border-emerald-300/30">
              <p className="text-6xl">🥁</p>
              <p className="text-white text-xl mt-2">Beats: {rhythmBeats}/16</p>
              <p className="text-white/60 text-sm">Tap the screen or a piano key to the beat</p>
              <button
                type="button"
                className="mt-4 w-full max-w-xs mx-auto block h-24 rounded-3xl bg-emerald-400 text-emerald-950 font-bold text-xl active:scale-95 transition"
                onClick={() =>
                  handleNote({
                    id: `tap-${Date.now()}`,
                    pitch: {
                      note: "C",
                      octave: 4,
                      midi: 60,
                      frequencyHz: 261.6,
                    },
                    onsetMs: performance.now(),
                    velocity: 0.8,
                    source: "touch",
                    confidence: 1,
                  })
                }
              >
                TAP!
              </button>
            </div>
          )}

          {(song || isNaming || isFree) && !isRhythm && (
            <PianoKeyboard
              startMidi={48}
              whiteKeys={15}
              highlightMidi={lastMidi}
              blackKeysOnly={!!song?.blackKeysOnly && !useTouch}
              onNote={(midi) => {
                touchRef.current?.press(midi);
              }}
            />
          )}

          {song && (
            <div className="flex justify-between text-white/70 text-sm">
              <span>
                Notes {progress.matched}/{progress.total}
              </span>
              <span>Accuracy {Math.round(progress.accuracy * 100)}%</span>
            </div>
          )}

          {isFree && (
            <Button variant="success" onClick={completeFreePlay}>
              I&apos;m done exploring — collect stars!
            </Button>
          )}

          {song && (
            <Button variant="secondary" size="sm" onClick={finishSong}>
              Finish early (still a win!)
            </Button>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 py-6">
          <p className="text-5xl">
            {stars === 3 ? "⭐⭐⭐" : stars === 2 ? "⭐⭐" : stars === 1 ? "⭐" : "🌟"}
          </p>
          <h2 className="text-2xl font-bold text-white">
            {stars >= 2 ? "Amazing work!" : stars === 1 ? "You did it!" : "Nice try — play again anytime!"}
          </h2>
          <p className="text-white/70">Your companion is proud of you.</p>
          <Button onClick={onExit} size="lg">
            Back to the island
          </Button>
        </div>
      )}
    </div>
  );
}
