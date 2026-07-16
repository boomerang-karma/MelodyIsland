"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MicNoteInput, TouchNoteInput } from "@/modules/audio";
import { pitchLabel } from "@/modules/core";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { Button } from "@/components/ui/Button";

export default function FreePlayPage() {
  const [listening, setListening] = useState(false);
  const [label, setLabel] = useState("Play anything — no goals, pure exploration.");
  const [history, setHistory] = useState<string[]>([]);
  const [lastMidi, setLastMidi] = useState<number | null>(null);
  const [drums, setDrums] = useState(false);
  const micRef = useRef<MicNoteInput | null>(null);
  const touchRef = useRef<TouchNoteInput | null>(null);
  const drumTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    touchRef.current = new TouchNoteInput();
    void touchRef.current.start();
    const off = touchRef.current.onNote((e) => {
      setLastMidi(e.pitch.midi);
      const name = pitchLabel(e.pitch);
      setLabel(`I hear ${name}!`);
      setHistory((h) => [name, ...h].slice(0, 12));
    });
    return () => {
      off();
      touchRef.current?.stop();
      micRef.current?.stop();
      if (drumTimer.current) clearInterval(drumTimer.current);
    };
  }, []);

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
      mic.onNote((e) => {
        setLastMidi(e.pitch.midi);
        const name = pitchLabel(e.pitch);
        setLabel(`I hear ${name}!`);
        setHistory((h) => [name, ...h].slice(0, 12));
      });
      micRef.current = mic;
      setListening(true);
    } catch {
      setLabel("Mic blocked — use the on-screen piano instead.");
    }
  }

  function toggleDrums() {
    if (drums) {
      if (drumTimer.current) clearInterval(drumTimer.current);
      setDrums(false);
      return;
    }
    setDrums(true);
    // Simple click track via oscillator blip
    drumTimer.current = setInterval(() => {
      if (typeof window === "undefined") return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = 80;
      g.gain.value = 0.15;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.1);
      osc.onended = () => void ctx.close();
    }, 500);
  }

  return (
    <main className="flex-1 px-2 sm:px-4 py-3 sm:py-5 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Free Play</h1>
          <p className="text-white/60 text-sm">Always unlocked · no stars pressure</p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Home
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 text-white text-xl text-center">
        {label}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={toggleMic} variant={listening ? "success" : "primary"}>
          {listening ? "Mic on 🎤" : "Listen with mic"}
        </Button>
        <Button variant="secondary" onClick={toggleDrums}>
          {drums ? "Stop drums" : "Add drum backing"}
        </Button>
        <Link href="/play">
          <Button variant="ghost">World map</Button>
        </Link>
      </div>

      <div className="piano-stage piano-stage--hero">
        <PianoKeyboard
          size="kid"
          multiTouch
          highlightMidi={lastMidi}
          onNote={(midi) => touchRef.current?.press(midi)}
        />
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-white/50 text-xs uppercase mb-2">Recent notes</p>
          <div className="flex flex-wrap gap-2">
            {history.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="rounded-lg bg-violet-500/30 px-2 py-1 text-sm text-white"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
