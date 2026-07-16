"use client";

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
  highlightMidi?: number | null;
  onNote?: (midi: number) => void;
  blackKeysOnly?: boolean;
  showLabels?: boolean;
  /** Tone length when this keyboard plays sound itself */
  noteDurationMs?: number;
  /** Set false if parent owns audio (e.g. classic sustain) */
  playSound?: boolean;
  /**
   * kid (default) — huge keys for iPad mini / little fingers
   * classic — tall stage piano
   * compact — denser (more octaves)
   */
  size?: PianoSize;
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
    // Fewer keys = each key is wider (better for small hands on iPad mini)
    defaultWhiteKeys: 11,
    defaultStartMidi: 53, // F3 → covers common beginner range through C5
    heightClass: "h-[min(42dvh,320px)] min-h-[220px] sm:h-[min(48dvh,380px)] sm:min-h-[260px]",
    labelClass: "bottom-3 sm:bottom-4 text-sm sm:text-base font-bold text-slate-700",
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
  onNote,
  blackKeysOnly = false,
  showLabels = true,
  noteDurationMs = 350,
  playSound = true,
  size = "kid",
}: Props) {
  const cfg = SIZE_CONFIG[size];
  const start = startMidi ?? cfg.defaultStartMidi;
  const count = whiteKeys ?? cfg.defaultWhiteKeys;

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

  const press = (m: number) => {
    if (playSound) {
      const pitch = midiToPitch(m);
      playTone(pitch.frequencyHz, noteDurationMs, 0.28);
    }
    onNote?.(m);
  };

  const keyWidth = 100 / count;

  return (
    <div
      className={`piano-keys relative w-full select-none touch-manipulation ${cfg.heightClass}`}
      role="group"
      aria-label="Piano keyboard"
    >
      {/* White keys — full width, fat for little fingers */}
      <div className="absolute inset-0 flex gap-0.5 sm:gap-1 px-0.5">
        {whites.map((m) => {
          const p = midiToPitch(m);
          const active = highlightMidi === m;
          const dim = blackKeysOnly;
          return (
            <button
              key={m}
              type="button"
              disabled={blackKeysOnly}
              // pointer events = instant on iPad (no 300ms click lag)
              onPointerDown={(e) => {
                if (blackKeysOnly) return;
                e.preventDefault();
                (e.currentTarget as HTMLButtonElement).setPointerCapture?.(
                  e.pointerId,
                );
                press(m);
              }}
              className={`relative flex-1 border-2 sm:border-[3px] border-slate-400/80 ${cfg.radius} shadow-md transition-transform duration-75 active:translate-y-1 active:brightness-95 ${
                dim
                  ? "bg-slate-200 opacity-35"
                  : active
                    ? "bg-violet-300 border-violet-500 scale-[0.98]"
                    : "bg-gradient-to-b from-white to-slate-100"
              }`}
              style={{ minWidth: 0, touchAction: "manipulation" }}
              aria-label={pitchLabel(p)}
            >
              {showLabels && (
                <span
                  className={`absolute left-0 right-0 text-center pointer-events-none ${cfg.labelClass}`}
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

      {/* Black keys — shorter but still wide enough to hit */}
      <div
        className={`absolute top-0 left-0 right-0 ${cfg.blackHeight} pointer-events-none px-0.5`}
      >
        {blacks.map(({ midi: m, left }) => {
          const active = highlightMidi === m;
          return (
            <button
              key={m}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                (e.currentTarget as HTMLButtonElement).setPointerCapture?.(
                  e.pointerId,
                );
                press(m);
              }}
              className={`absolute pointer-events-auto rounded-b-xl border-2 border-black shadow-lg transition-transform duration-75 active:translate-y-0.5 ${
                active
                  ? "bg-violet-600 border-violet-300 scale-[0.98]"
                  : "bg-gradient-to-b from-slate-800 to-black"
              }`}
              style={{
                left: `calc(${left * keyWidth}% + 2px)`,
                width: `calc(${keyWidth * 0.62}% - 4px)`,
                height: "100%",
                minWidth: size === "kid" ? 28 : 18,
                touchAction: "manipulation",
              }}
              aria-label={pitchLabel(midiToPitch(m))}
            >
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
