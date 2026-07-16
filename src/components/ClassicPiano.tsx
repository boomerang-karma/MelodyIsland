"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { midiToPitch, pitchLabel } from "@/modules/core";
import { MicNoteInput } from "@/modules/audio";
import { PianoKeyboard } from "./PianoKeyboard";
import { Button } from "./ui/Button";

/**
 * Classic Piano mode — elegant, no game overlay.
 * Mic + on-screen keys, optional metronome, note history.
 */
export function ClassicPiano() {
  const [lastMidi, setLastMidi] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [labels, setLabels] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const [bpm, setBpm] = useState(90);
  const [sustain, setSustain] = useState(true);
  const [octaveShift, setOctaveShift] = useState(0);
  const micRef = useRef<MicNoteInput | null>(null);
  const metroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onHeard = useCallback((midi: number) => {
    setLastMidi(midi);
    const name = pitchLabel(midiToPitch(midi));
    setHistory((h) => [name, ...h].slice(0, 16));
  }, []);

  useEffect(() => {
    return () => {
      micRef.current?.stop();
      if (metroRef.current) clearInterval(metroRef.current);
    };
  }, []);

  useEffect(() => {
    if (metroRef.current) {
      clearInterval(metroRef.current);
      metroRef.current = null;
    }
    if (!metronome) return;
    const ms = 60000 / bpm;
    const click = (strong: boolean) => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = strong ? 1200 : 800;
      g.gain.value = strong ? 0.12 : 0.06;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.06);
      osc.onended = () => void ctx.close();
    };
    let beat = 0;
    click(true);
    metroRef.current = setInterval(() => {
      beat = (beat + 1) % 4;
      click(beat === 0);
    }, ms);
    return () => {
      if (metroRef.current) clearInterval(metroRef.current);
    };
  }, [metronome, bpm]);

  async function toggleMic() {
    if (listening) {
      micRef.current?.stop();
      micRef.current = null;
      setListening(false);
      return;
    }
    try {
      const mic = new MicNoteInput();
      await mic.start();
      mic.onNote((e) => onHeard(e.pitch.midi));
      micRef.current = mic;
      setListening(true);
    } catch {
      /* mic blocked */
    }
  }

  const startMidi = 48 + octaveShift * 12;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-amber-900/40 bg-gradient-to-b from-stone-900 via-stone-950 to-black p-4 sm:p-6 shadow-2xl">
        {/* Classic piano lid / brand bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-amber-200/70 text-xs uppercase tracking-[0.25em]">
              Melody Islands
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-amber-50">
              Classic Piano
            </h2>
          </div>
          <div className="text-right">
            <p className="text-amber-100/50 text-xs">Now playing</p>
            <p className="text-2xl font-mono text-amber-100 tabular-nums min-h-[2rem]">
              {lastMidi != null ? pitchLabel(midiToPitch(lastMidi)) : "—"}
            </p>
          </div>
        </div>

        <div className="piano-stage piano-stage--hero rounded-2xl bg-black/40 border border-white/5 p-1.5 sm:p-2">
          <PianoKeyboard
            size="kid"
            multiTouch
            startMidi={startMidi}
            highlightMidi={lastMidi}
            showLabels={labels}
            playSound
            noteDurationMs={sustain ? 900 : 280}
            onNote={(midi) => onHeard(midi)}
          />
        </div>

        {/* Pedal strip */}
        <div className="mt-4 flex justify-center gap-6">
          {["Soft", "Sostenuto", "Sustain"].map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => i === 2 && setSustain((s) => !s)}
              className={`w-16 sm:w-20 h-8 rounded-b-xl border text-[10px] uppercase tracking-wide ${
                i === 2 && sustain
                  ? "bg-amber-200/90 border-amber-100 text-stone-900"
                  : "bg-stone-700/80 border-stone-500 text-stone-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={listening ? "success" : "primary"}
          onClick={toggleMic}
        >
          {listening ? "Mic on 🎤" : "Listen (mic)"}
        </Button>
        <Button variant="secondary" onClick={() => setLabels((v) => !v)}>
          Labels: {labels ? "On" : "Off"}
        </Button>
        <Button
          variant={metronome ? "success" : "secondary"}
          onClick={() => setMetronome((v) => !v)}
        >
          Metronome {metronome ? "On" : "Off"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBpm((b) => Math.max(40, b - 5))}
        >
          − BPM
        </Button>
        <span className="self-center text-white/80 text-sm tabular-nums">
          {bpm}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBpm((b) => Math.min(180, b + 5))}
        >
          + BPM
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOctaveShift((o) => Math.max(-1, o - 1))}
        >
          Oct ↓
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOctaveShift((o) => Math.min(1, o + 1))}
        >
          Oct ↑
        </Button>
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-white/50 text-xs uppercase mb-2">Note trail</p>
          <div className="flex flex-wrap gap-2">
            {history.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="rounded-lg bg-amber-500/20 border border-amber-400/20 px-2 py-1 text-sm text-amber-50 font-mono"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
