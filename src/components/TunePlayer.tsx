"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityResult, CompanionMood, FamousTune } from "@/modules/core";
import { pitchLabel } from "@/modules/core";
import { getFamousSong } from "@/modules/curriculum";
import { MicNoteInput, TouchNoteInput, playTone } from "@/modules/audio";
import { Scorer } from "@/modules/scoring";
import { moodFromTiming } from "@/modules/companion";
import { FallingNotes } from "./FallingNotes";
import { PianoKeyboard } from "./PianoKeyboard";
import { Button } from "./ui/Button";
import type { CompanionState } from "@/modules/core";
import { CompanionBubble } from "./CompanionBubble";

interface Props {
  tune: FamousTune;
  companion?: CompanionState | null;
  onComplete?: (result: ActivityResult) => void;
  onExit: () => void;
}

export function TunePlayer({ tune, companion, onComplete, onExit }: Props) {
  const song = getFamousSong(tune.songId);
  const scorerRef = useRef(new Scorer({ timingWindowMs: 220 }));
  const micRef = useRef<MicNoteInput | null>(null);
  const touchRef = useRef<TouchNoteInput | null>(null);
  const startedAt = useRef(new Date().toISOString());

  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState(tune.blurb);
  const [lastMidi, setLastMidi] = useState<number | null>(null);
  const [hitIndices, setHitIndices] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ matched: 0, total: 0, accuracy: 0 });
  const [mood, setMood] = useState<CompanionMood>("curious");
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [useTouch, setUseTouch] = useState(true);
  const [demoPlaying, setDemoPlaying] = useState(false);

  const finish = useCallback(() => {
    setPlaying(false);
    const s = scorerRef.current.computeStars();
    setStars(s);
    setPhase("done");
    setMood("cheer");
    const skillDeltas: Record<string, number> = {};
    (song?.skillIds ?? []).forEach((id) => {
      skillDeltas[id] = s >= 1 ? 1 : -0.2;
    });
    onComplete?.({
      activityId: `famous-${tune.id}`,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      stars: s,
      accuracy: scorerRef.current.getProgress().accuracy,
      avgTimingOffsetMs: scorerRef.current.avgTimingOffsetMs(),
      attempts: scorerRef.current.getResults(),
      skillDeltas,
    });
  }, [onComplete, song?.skillIds, tune.id]);

  const handleNote = useCallback(
    (event: {
      id: string;
      pitch: { midi: number; frequencyHz: number; note: string; octave: number };
      onsetMs: number;
      velocity: number;
      source: "mic" | "midi" | "touch" | "synth";
      confidence: number;
    }) => {
      setLastMidi(event.pitch.midi);
      playTone(event.pitch.frequencyHz, 140, 0.1);
      if (!song) return;
      scorerRef.current.allowTouchCredit = useTouch;
      const result = scorerRef.current.process(event as never);
      setFeedback(result.feedback);
      setMood(
        moodFromTiming(
          result.timingOffsetMs != null ? Math.abs(result.timingOffsetMs) : null,
          result.hit,
        ),
      );
      if (result.hit && result.expected) {
        setHitIndices((prev) => {
          const next = new Set(prev);
          const idx = song.notes.findIndex(
            (n) =>
              n.startMs === result.expected!.startMs &&
              n.pitch.midi === result.expected!.pitch.midi,
          );
          if (idx >= 0) next.add(idx);
          return next;
        });
      }
      const p = scorerRef.current.getProgress();
      setProgress(p);
      if (p.total > 0 && p.matched >= p.total) finish();
    },
    [song, useTouch, finish],
  );

  async function startPlay() {
    if (!song) return;
    startedAt.current = new Date().toISOString();
    setPhase("play");
    setHitIndices(new Set());
    scorerRef.current.loadTrack(song);
    scorerRef.current.allowTouchCredit = useTouch;
    scorerRef.current.begin(performance.now());
    setProgress({ matched: 0, total: song.notes.length, accuracy: 0 });

    touchRef.current = new TouchNoteInput();
    await touchRef.current.start();
    touchRef.current.onNote(handleNote);

    if (!useTouch) {
      try {
        micRef.current = new MicNoteInput();
        await micRef.current.start();
        micRef.current.onNote(handleNote);
      } catch {
        setUseTouch(true);
        scorerRef.current.allowTouchCredit = true;
      }
    }
    setPlaying(true);
    setFeedback(`Play along — ${tune.title}!`);
  }

  async function playDemo() {
    if (!song || demoPlaying) return;
    setDemoPlaying(true);
    const t0 = performance.now();
    for (const note of song.notes) {
      const wait = note.startMs - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setLastMidi(note.pitch.midi);
      playTone(note.pitch.frequencyHz, Math.max(120, note.durationMs * 0.9), 0.22);
      setFeedback(`Demo: ${pitchLabel(note.pitch)}`);
    }
    setDemoPlaying(false);
    setFeedback("Your turn! Press Start when ready.");
  }

  useEffect(() => {
    return () => {
      micRef.current?.stop();
      touchRef.current?.stop();
    };
  }, []);

  if (!song) {
    return (
      <div className="text-white">
        Song data missing.{" "}
        <Button onClick={onExit}>Back</Button>
      </div>
    );
  }

  const diffStars = "★".repeat(tune.difficulty) + "☆".repeat(3 - tune.difficulty);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest">
            Famous tunes · {diffStars}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {tune.emoji} {tune.title}
          </h1>
          <p className="text-white/60 text-sm">{tune.artist}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Back
        </Button>
      </div>

      {companion && <CompanionBubble companion={companion} mood={mood} />}

      <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white">
        {feedback}
      </div>

      {phase === "intro" && (
        <div className="space-y-4">
          <p className="text-white/75 text-sm leading-relaxed">{tune.blurb}</p>
          <p className="text-white/50 text-xs">
            Simplified learning arrangement · ~{tune.estimatedMinutes} min ·{" "}
            {song.notes.length} notes · {song.bpm} BPM
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={startPlay}>
              Start learning
            </Button>
            <Button variant="secondary" onClick={playDemo} disabled={demoPlaying}>
              {demoPlaying ? "Playing demo…" : "Hear demo"}
            </Button>
            <Button variant="ghost" onClick={() => setUseTouch((v) => !v)}>
              Input: {useTouch ? "On-screen" : "Microphone"}
            </Button>
          </div>
        </div>
      )}

      {phase === "play" && (
        <div className="space-y-4">
          <FallingNotes
            track={song}
            playing={playing}
            elapsedMs={0}
            hitIndices={hitIndices}
          />
          <PianoKeyboard
            startMidi={48}
            whiteKeys={15}
            highlightMidi={lastMidi}
            onNote={(midi) => touchRef.current?.press(midi)}
          />
          <div className="flex justify-between text-white/70 text-sm">
            <span>
              Notes {progress.matched}/{progress.total}
            </span>
            <span>Accuracy {Math.round(progress.accuracy * 100)}%</span>
          </div>
          <Button variant="secondary" size="sm" onClick={finish}>
            Finish early (still a win!)
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-4 py-6">
          <p className="text-5xl">
            {stars === 3 ? "⭐⭐⭐" : stars === 2 ? "⭐⭐" : stars === 1 ? "⭐" : "🌟"}
          </p>
          <h2 className="text-2xl font-bold text-white">
            {stars >= 2 ? `You nailed ${tune.title}!` : "Great practice!"}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                setPhase("intro");
                setStars(0);
              }}
            >
              Play again
            </Button>
            <Button variant="secondary" onClick={onExit}>
              More tunes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
