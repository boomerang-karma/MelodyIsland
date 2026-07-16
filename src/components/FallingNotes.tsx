"use client";

import { useEffect, useState } from "react";
import type { SongTrack } from "@/modules/core";
import { pitchLabel } from "@/modules/core";

interface Props {
  track: SongTrack;
  playing: boolean;
  elapsedMs: number;
  hitIndices: Set<number>;
}

/** Simple falling-note highway — enhance with SpriteKit-class canvas later */
export function FallingNotes({ track, playing, elapsedMs, hitIndices }: Props) {
  const [now, setNow] = useState(elapsedMs);

  useEffect(() => {
    if (!playing) {
      setNow(elapsedMs);
      return;
    }
    const start = performance.now() - elapsedMs;
    let raf = 0;
    const tick = () => {
      setNow(performance.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, elapsedMs]);

  const lookAhead = 2500;
  const visible = track.notes
    .map((n, i) => ({ n, i }))
    .filter(({ n, i }) => {
      if (hitIndices.has(i)) return false;
      const dt = n.startMs - now;
      return dt > -200 && dt < lookAhead;
    });

  return (
    <div className="relative h-48 sm:h-56 rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden">
      {/* Hit line */}
      <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent" />
      <div className="absolute bottom-6 left-4 text-[10px] uppercase tracking-widest text-white/40">
        Play here
      </div>
      {visible.map(({ n, i }) => {
        const dt = n.startMs - now;
        const y = 100 - (dt / lookAhead) * 100;
        const minMidi = Math.min(...track.notes.map((x) => x.pitch.midi));
        const maxMidi = Math.max(...track.notes.map((x) => x.pitch.midi));
        const range = Math.max(1, maxMidi - minMidi);
        const x = ((n.pitch.midi - minMidi) / range) * 80 + 10;
        return (
          <div
            key={i}
            className="absolute w-12 h-12 -ml-6 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-lg shadow-fuchsia-500/40 flex items-center justify-center text-white text-xs font-bold border border-white/30 transition-none"
            style={{
              left: `${x}%`,
              top: `${Math.min(92, Math.max(0, y))}%`,
              transform: "translateY(-50%)",
            }}
          >
            {pitchLabel(n.pitch)}
          </div>
        );
      })}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
          Press Start to begin
        </div>
      )}
    </div>
  );
}
