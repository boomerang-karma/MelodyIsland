"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityResult, CompanionMood, FamousTune } from "@/modules/core";
import { pitchLabel, type SongTrack } from "@/modules/core";
import {
  getFamousSong,
  nextGuideMidis,
  scaleTrackTempo,
} from "@/modules/curriculum";
import { MicNoteInput, TouchNoteInput, playTone } from "@/modules/audio";
import { Scorer } from "@/modules/scoring";
import { moodFromTiming } from "@/modules/companion";
import { FallingNotes } from "./FallingNotes";
import { NoteSequenceGuide } from "./NoteSequenceGuide";
import { PianoKeyboard } from "./PianoKeyboard";
import { SpeedBar } from "./SpeedBar";
import { Button } from "./ui/Button";
import type { CompanionState } from "@/modules/core";
import { CompanionBubble } from "./CompanionBubble";

interface Props {
  tune: FamousTune;
  companion?: CompanionState | null;
  onComplete?: (result: ActivityResult) => void;
  onExit: () => void;
}

/** Default under 100% so first tries feel calmer for age ~7 */
const DEFAULT_SPEED = 0.7;

export function TunePlayer({ tune, companion, onComplete, onExit }: Props) {
  const baseSong = getFamousSong(tune.songId);
  const scorerRef = useRef(new Scorer({ timingWindowMs: 240 }));
  const trackRef = useRef<SongTrack | null>(null);
  const micRef = useRef<MicNoteInput | null>(null);
  const touchRef = useRef<TouchNoteInput | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const demoCancel = useRef(false);

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
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [missFlash, setMissFlash] = useState(false);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const song = useMemo(
    () => (baseSong ? scaleTrackTempo(baseSong, speed) : undefined),
    [baseSong, speed],
  );

  const finish = useCallback(() => {
    setPlaying(false);
    const s = scorerRef.current.computeStars();
    setStars(s);
    setPhase("done");
    setMood("cheer");
    const skillDeltas: Record<string, number> = {};
    (baseSong?.skillIds ?? []).forEach((id) => {
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
  }, [onComplete, baseSong?.skillIds, tune.id]);

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
      const track = trackRef.current;
      if (!track) return;
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
        setMissFlash(false);
        setHitIndices((prev) => {
          const next = new Set(prev);
          const idx = track.notes.findIndex(
            (n) =>
              n.startMs === result.expected!.startMs &&
              n.pitch.midi === result.expected!.pitch.midi,
          );
          if (idx >= 0) next.add(idx);
          return next;
        });
      } else {
        // Flash the current sequence step so kids see what was expected
        setMissFlash(true);
        if (missTimer.current) clearTimeout(missTimer.current);
        missTimer.current = setTimeout(() => setMissFlash(false), 450);
      }
      const p = scorerRef.current.getProgress();
      setProgress(p);
      if (p.total > 0 && p.matched >= p.total) finish();
    },
    [useTouch, finish],
  );

  const beginRound = useCallback(
    async (speedForRound: number) => {
      if (!baseSong) return;
      const track = scaleTrackTempo(baseSong, speedForRound);
      trackRef.current = track;
      startedAt.current = new Date().toISOString();
      setPhase("play");
      setHitIndices(new Set());
      scorerRef.current = new Scorer({
        timingWindowMs: Math.round(240 / Math.max(0.5, speedForRound)),
      });
      scorerRef.current.loadTrack(track);
      scorerRef.current.allowTouchCredit = useTouch;
      scorerRef.current.begin(performance.now());
      setProgress({ matched: 0, total: track.notes.length, accuracy: 0 });

      touchRef.current?.stop();
      micRef.current?.stop();

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
      setFeedback(
        speedForRound < 0.85
          ? `Nice and easy — ${tune.title} at ${Math.round(speedForRound * 100)}% speed!`
          : `Play along — ${tune.title}!`,
      );
    },
    [baseSong, useTouch, handleNote, tune.title],
  );

  function onSpeedChange(next: number) {
    setSpeed(next);
    demoCancel.current = true;
    if (phase === "play") {
      setFeedback(`Speed set to ${Math.round(next * 100)}% — restarting gently…`);
      void beginRound(next);
    }
  }

  async function playDemo() {
    if (!baseSong || demoPlaying) return;
    demoCancel.current = false;
    const track = scaleTrackTempo(baseSong, speed);
    setDemoPlaying(true);
    const t0 = performance.now();
    for (const note of track.notes) {
      if (demoCancel.current) break;
      const wait = note.startMs - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (demoCancel.current) break;
      setLastMidi(note.pitch.midi);
      playTone(note.pitch.frequencyHz, Math.max(120, note.durationMs * 0.9), 0.22);
      setFeedback(`Demo (${Math.round(speed * 100)}%): ${pitchLabel(note.pitch)}`);
    }
    setDemoPlaying(false);
    if (!demoCancel.current) {
      setFeedback("Your turn! Adjust speed if needed, then press Start.");
    }
  }

  useEffect(() => {
    return () => {
      demoCancel.current = true;
      micRef.current?.stop();
      touchRef.current?.stop();
      if (missTimer.current) clearTimeout(missTimer.current);
    };
  }, []);

  if (!baseSong || !song) {
    return (
      <div className="text-white">
        Song data missing.{" "}
        <Button onClick={onExit}>Back</Button>
      </div>
    );
  }

  const diffStars = "★".repeat(tune.difficulty) + "☆".repeat(3 - tune.difficulty);
  const activeTrack = trackRef.current && phase === "play" ? trackRef.current : song;
  const guideMidis =
    phase === "play" && activeTrack
      ? nextGuideMidis(activeTrack, hitIndices)
      : [];

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

      {(phase === "intro" || phase === "play") && (
        <SpeedBar
          value={speed}
          onChange={onSpeedChange}
          disabled={demoPlaying}
        />
      )}

      {phase === "intro" && (
        <div className="space-y-4">
          <p className="text-white/75 text-sm leading-relaxed">{tune.blurb}</p>
          <p className="text-white/50 text-xs">
            Simplified learning arrangement · ~{tune.estimatedMinutes} min ·{" "}
            {baseSong.notes.length} notes · practice at{" "}
            {Math.round(song.bpm)} BPM ({Math.round(speed * 100)}% speed)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={() => void beginRound(speed)}>
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
          {/* Falling notes + upper-right sequence map (always visible reference) */}
          <div className="relative">
            <FallingNotes
              track={activeTrack}
              playing={playing}
              elapsedMs={0}
              hitIndices={hitIndices}
              speed={speed}
            />
            <div className="mt-2 sm:mt-0 sm:absolute sm:top-2 sm:right-2 sm:z-20 sm:w-[min(52%,17rem)]">
              <NoteSequenceGuide
                track={activeTrack}
                hitIndices={hitIndices}
                missFlash={missFlash}
              />
            </div>
          </div>

          <div className="piano-stage piano-stage--hero">
            {guideMidis.length > 0 && (
              <p className="text-center text-amber-200 text-sm font-semibold mb-2">
                👉 Press the glowing key
                {guideMidis.length > 1 ? "s together" : ""}!
              </p>
            )}
            <PianoKeyboard
              size="kid"
              multiTouch
              highlightMidi={lastMidi}
              guideMidis={guideMidis}
              onNote={(midi) => touchRef.current?.press(midi)}
            />
          </div>
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
          <p className="text-white/60 text-sm">
            You practiced at {Math.round(speed * 100)}% speed. Try a little
            faster next time — only if it still feels fun!
          </p>
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
