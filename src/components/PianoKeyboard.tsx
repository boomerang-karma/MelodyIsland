"use client";

import { useCallback, useRef, useState } from "react";
import { midiToPitch, pitchLabel, type NoteName } from "@/modules/core";
import { playTone } from "@/modules/audio";

const BLACK_OFFSET: Partial<Record<NoteName, number>> = {
  C: 0.62,
  D: 1.62,
  F: 3.62,
  G: 4.62,
  A: 5.62,
};

export type PianoSize = "kid" | "classic" | "compact";

interface Props {
  startMidi?: number;
  whiteKeys?: number;
  /** Keys just pressed (feedback) — number or set */
  highlightMidi?: number | null;
  highlightMidis?: number[];
  /**
   * Keys the kid should press next (learning guide).
   * Glows so they can follow without reading notes.
   */
  guideMidis?: number[];
  onNote?: (midi: number) => void;
  /** Fired once when a multi-touch chord is held (2+ keys) */
  onChord?: (midis: number[]) => void;
  blackKeysOnly?: boolean;
  showLabels?: boolean;
  noteDurationMs?: number;
  playSound?: boolean;
  size?: PianoSize;
  /** Allow pressing several keys at once (default true) */
  multiTouch?: boolean;
}

const SIZE_CONFIG: Record<
  PianoSize,
  {
    defaultWhiteKeys: number;
    defaultStartMidi: number;
    heightClass: string;
    labelClass: string;
    blackLabelClass: string;
    blackHeight: string;
    radius: string;
  }
> = {
  kid: {
    // Wider keys; 12 whites ≈ F3–C5 covers most kid tunes
    defaultWhiteKeys: 12,
    defaultStartMidi: 53,
    heightClass:
      "h-[min(42dvh,320px)] min-h-[220px] sm:h-[min(48dvh,380px)] sm:min-h-[260px]",
    labelClass:
      "bottom-3 sm:bottom-4 text-sm sm:text-base font-bold text-slate-700",
    blackLabelClass: "bottom-2 text-[11px] sm:text-xs font-bold text-white/90",
    blackHeight: "h-[58%]",
    radius: "rounded-b-2xl",
  },
  classic: {
    defaultWhiteKeys: 14,
    defaultStartMidi: 48,
    heightClass: "h-[min(36dvh,280px)] min-h-[200px] sm:min-h-[240px]",
    labelClass: "bottom-3 text-xs sm:text-sm font-semibold text-slate-600",
    blackLabelClass: "bottom-1.5 text-[10px] text-white/85",
    blackHeight: "h-[56%]",
    radius: "rounded-b-xl",
  },
  compact: {
    defaultWhiteKeys: 15,
    defaultStartMidi: 48,
    heightClass: "h-40 sm:h-44 min-h-[160px]",
    labelClass: "bottom-2 text-[10px] sm:text-xs font-medium text-slate-600",
    blackLabelClass: "bottom-1 text-[9px] text-white/80",
    blackHeight: "h-[55%]",
    radius: "rounded-b-lg",
  },
};

export function PianoKeyboard({
  startMidi,
  whiteKeys,
  highlightMidi = null,
  highlightMidis = [],
  guideMidis = [],
  onNote,
  onChord,
  blackKeysOnly = false,
  showLabels = true,
  noteDurationMs = 350,
  playSound = true,
  size = "kid",
  multiTouch = true,
}: Props) {
  const cfg = SIZE_CONFIG[size];
  const start = startMidi ?? cfg.defaultStartMidi;
  const count = whiteKeys ?? cfg.defaultWhiteKeys;

  /** pointerId → midi for multi-touch tracking */
  const pointers = useRef(new Map<number, number>());
  const [heldMidis, setHeldMidis] = useState<Set<number>>(() => new Set());

  const whites: number[] = [];
  let midi = start;
  while (whites.length < count) {
    const p = midiToPitch(midi);
    if (!p.note.includes("#")) whites.push(midi);
    midi++;
  }

  const blacks: { midi: number; left: number }[] = [];
  whites.forEach((wMidi, i) => {
    const p = midiToPitch(wMidi);
    const next = midiToPitch(wMidi + 1);
    if (next.note.includes("#")) {
      const offset = BLACK_OFFSET[p.note];
      if (offset != null) {
        blacks.push({ midi: wMidi + 1, left: i + 0.62 });
      }
    }
  });

  const guideSet = new Set(guideMidis);
  const highlightSet = new Set(
    [
      ...(highlightMidi != null ? [highlightMidi] : []),
      ...highlightMidis,
    ].filter((n) => n != null),
  );

  const pressDown = useCallback(
    (m: number, pointerId: number) => {
      if (!multiTouch && pointers.current.size > 0) return;

      // Don't re-fire same key held by another finger
      for (const existing of pointers.current.values()) {
        if (existing === m) return;
      }

      pointers.current.set(pointerId, m);
      setHeldMidis(new Set(pointers.current.values()));

      if (playSound) {
        const pitch = midiToPitch(m);
        playTone(pitch.frequencyHz, noteDurationMs, 0.28);
      }
      onNote?.(m);

      const held = [...new Set(pointers.current.values())];
      if (held.length >= 2) {
        onChord?.(held);
      }
    },
    [multiTouch, playSound, noteDurationMs, onNote, onChord],
  );

  const pressUp = useCallback((pointerId: number) => {
    if (!pointers.current.has(pointerId)) return;
    pointers.current.delete(pointerId);
    setHeldMidis(new Set(pointers.current.values()));
  }, []);

  const keyWidth = 100 / count;

  function keyClasses(m: number, isBlack: boolean) {
    const isGuide = guideSet.has(m);
    const isHeld = heldMidis.has(m);
    const isHit = highlightSet.has(m);
    const dim = blackKeysOnly && !isBlack;

    if (dim) {
      return isBlack
        ? "bg-slate-700 opacity-40"
        : "bg-slate-200 opacity-35";
    }

    if (isGuide && isHeld) {
      return isBlack
        ? "bg-emerald-500 border-emerald-200 scale-[0.98] key-guide-hit"
        : "bg-emerald-300 border-emerald-500 scale-[0.98] key-guide-hit";
    }
    if (isGuide) {
      return isBlack
        ? "bg-amber-400 border-yellow-200 key-guide-glow"
        : "bg-amber-200 border-amber-400 key-guide-glow text-amber-950";
    }
    if (isHeld || isHit) {
      return isBlack
        ? "bg-violet-600 border-violet-300 scale-[0.98]"
        : "bg-violet-300 border-violet-500 scale-[0.98]";
    }
    return isBlack
      ? "bg-gradient-to-b from-slate-800 to-black border-black"
      : "bg-gradient-to-b from-white to-slate-100 border-slate-400/80";
  }

  function bindKey(m: number, disabled: boolean) {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        pressDown(m, e.pointerId);
      },
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        pressUp(e.pointerId);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
        pressUp(e.pointerId);
      },
      onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => {
        pressUp(e.pointerId);
      },
    };
  }

  return (
    <div
      className={`piano-keys relative w-full select-none touch-manipulation ${cfg.heightClass}`}
      role="group"
      aria-label="Piano keyboard — multi-touch supported"
      // Allow multiple simultaneous touches on children
      style={{ touchAction: "none" }}
    >
      {guideMidis.length > 0 && (
        <p className="sr-only">
          Press glowing key
          {guideMidis.length > 1 ? "s" : ""}:{" "}
          {guideMidis.map((m) => pitchLabel(midiToPitch(m))).join(" and ")}
        </p>
      )}

      <div className="absolute inset-0 flex gap-0.5 sm:gap-1 px-0.5">
        {whites.map((m) => {
          const p = midiToPitch(m);
          const isGuide = guideSet.has(m);
          return (
            <button
              key={m}
              type="button"
              disabled={blackKeysOnly}
              {...bindKey(m, blackKeysOnly)}
              className={`relative flex-1 border-2 sm:border-[3px] ${cfg.radius} shadow-md transition-all duration-100 ${keyClasses(m, false)}`}
              style={{ minWidth: 0, touchAction: "none" }}
              aria-label={`${pitchLabel(p)}${isGuide ? " — press this" : ""}`}
              aria-pressed={heldMidis.has(m)}
            >
              {isGuide && (
                <span
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"
                  aria-hidden
                />
              )}
              {showLabels && (
                <span
                  className={`absolute left-0 right-0 text-center pointer-events-none ${cfg.labelClass} ${
                    isGuide ? "!text-amber-950" : ""
                  }`}
                >
                  {p.note}
                  <span className="block text-[0.65em] opacity-60 font-medium">
                    {p.octave}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className={`absolute top-0 left-0 right-0 ${cfg.blackHeight} pointer-events-none px-0.5`}
      >
        {blacks.map(({ midi: m, left }) => {
          const isGuide = guideSet.has(m);
          return (
            <button
              key={m}
              type="button"
              {...bindKey(m, false)}
              className={`absolute pointer-events-auto rounded-b-xl border-2 shadow-lg transition-all duration-100 ${keyClasses(m, true)}`}
              style={{
                left: `calc(${left * keyWidth}% + 2px)`,
                width: `calc(${keyWidth * 0.62}% - 4px)`,
                height: "100%",
                minWidth: size === "kid" ? 28 : 18,
                touchAction: "none",
                zIndex: isGuide ? 5 : 2,
              }}
              aria-label={`${pitchLabel(midiToPitch(m))}${isGuide ? " — press this" : ""}`}
              aria-pressed={heldMidis.has(m)}
            >
              {isGuide && (
                <span
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-300 animate-ping"
                  aria-hidden
                />
              )}
              {showLabels && (
                <span
                  className={`absolute left-0 right-0 text-center pointer-events-none ${cfg.blackLabelClass}`}
                >
                  {midiToPitch(m).note}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
