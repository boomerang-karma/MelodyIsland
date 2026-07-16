"use client";

import { useEffect, useMemo, useRef } from "react";
import type { SongTrack } from "@/modules/core";
import { pitchLabel } from "@/modules/core";

interface Props {
  track: SongTrack;
  /** Indices of notes already hit correctly */
  hitIndices: Set<number>;
  /** Optional: briefly flash a wrong attempt on the current target */
  missFlash?: boolean;
  className?: string;
}

/**
 * Upper-right sequence map for learning: shows every note in order.
 * Lights up (gold/green) as the kid plays each key correctly.
 * The next note pulses so there's always a reference after notes fall past.
 */
export function NoteSequenceGuide({
  track,
  hitIndices,
  missFlash = false,
  className = "",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const nextIndex = useMemo(() => {
    for (let i = 0; i < track.notes.length; i++) {
      if (!hitIndices.has(i)) return i;
    }
    return track.notes.length; // all done
  }, [track.notes.length, hitIndices]);

  // Keep the "next" chip in view as they progress
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-seq-idx="${nextIndex}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [nextIndex]);

  const done = nextIndex >= track.notes.length;

  return (
    <div
      className={`rounded-2xl border border-white/20 bg-slate-950/90 backdrop-blur-md shadow-xl ${className}`}
      role="list"
      aria-label="Note sequence to play"
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-sky-200/80 font-semibold">
          Play these
        </p>
        <p className="text-[10px] sm:text-xs text-white/50 tabular-nums">
          {Math.min(nextIndex, track.notes.length)}/{track.notes.length}
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-wrap content-start gap-1.5 sm:gap-2 px-2.5 pb-2.5 max-h-[7.5rem] sm:max-h-[9rem] overflow-y-auto overscroll-contain"
      >
        {track.notes.map((n, i) => {
          const hit = hitIndices.has(i);
          const isNext = i === nextIndex;
          const isMiss = isNext && missFlash;
          return (
            <div
              key={i}
              data-seq-idx={i}
              role="listitem"
              aria-current={isNext ? "step" : undefined}
              className={[
                "relative flex flex-col items-center justify-center min-w-[2.35rem] sm:min-w-[2.6rem] h-11 sm:h-12 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all duration-200",
                hit
                  ? "bg-emerald-400 border-emerald-200 text-emerald-950 shadow-md shadow-emerald-400/40 scale-100"
                  : isNext
                    ? isMiss
                      ? "bg-rose-400/90 border-rose-200 text-rose-950 animate-pulse"
                      : "bg-amber-300 border-yellow-100 text-amber-950 shadow-lg shadow-amber-300/50 scale-110 animate-pulse"
                    : "bg-white/10 border-white/15 text-white/70",
              ].join(" ")}
            >
              <span className="leading-none">{pitchLabel(n.pitch)}</span>
              <span
                className={`text-[9px] font-semibold mt-0.5 ${
                  hit ? "text-emerald-800/80" : isNext ? "text-amber-900/70" : "text-white/40"
                }`}
              >
                {i + 1}
              </span>
              {hit && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border border-white text-[9px] flex items-center justify-center text-white"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {done && (
        <p className="px-3 pb-2 text-center text-emerald-300 text-xs font-semibold">
          Sequence complete! ⭐
        </p>
      )}
      {!done && (
        <p className="px-3 pb-2 text-[10px] text-white/40 text-center sm:text-left">
          Next:{" "}
          <span className="text-amber-200 font-semibold">
            {pitchLabel(track.notes[nextIndex].pitch)}
          </span>
        </p>
      )}
    </div>
  );
}
