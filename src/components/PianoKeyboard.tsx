"use client";

import { midiToPitch, pitchLabel, type NoteName } from "@/modules/core";
import { playTone } from "@/modules/audio";

const WHITE: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_OFFSET: Partial<Record<NoteName, number>> = {
  C: 0.65,
  D: 1.65,
  F: 3.65,
  G: 4.65,
  A: 5.65,
};

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
}

export function PianoKeyboard({
  startMidi = 60,
  whiteKeys = 14,
  highlightMidi = null,
  onNote,
  blackKeysOnly = false,
  showLabels = true,
  noteDurationMs = 350,
  playSound = true,
}: Props) {
  const whites: number[] = [];
  let midi = startMidi;
  while (whites.length < whiteKeys) {
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
        blacks.push({ midi: wMidi + 1, left: i + 0.65 });
      }
    }
  });

  const press = (m: number) => {
    if (playSound) {
      const pitch = midiToPitch(m);
      playTone(pitch.frequencyHz, noteDurationMs, 0.25);
    }
    onNote?.(m);
  };

  const keyWidth = 100 / whiteKeys;

  return (
    <div className="relative w-full select-none touch-manipulation" style={{ height: 160 }}>
      <div className="absolute inset-0 flex">
        {whites.map((m) => {
          const p = midiToPitch(m);
          const active = highlightMidi === m;
          const dim = blackKeysOnly;
          return (
            <button
              key={m}
              type="button"
              disabled={blackKeysOnly}
              onClick={() => !blackKeysOnly && press(m)}
              className={`relative border border-slate-300 rounded-b-lg transition ${
                dim ? "bg-slate-200 opacity-40" : active ? "bg-violet-200" : "bg-white hover:bg-violet-50"
              }`}
              style={{ width: `${keyWidth}%` }}
            >
              {showLabels && (
                <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs font-medium text-slate-600">
                  {pitchLabel(p)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="absolute top-0 left-0 right-0 h-[58%] pointer-events-none">
        {blacks.map(({ midi: m, left }) => {
          const active = highlightMidi === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => press(m)}
              className={`absolute pointer-events-auto rounded-b-md border border-slate-900 shadow-md ${
                active ? "bg-violet-600" : "bg-slate-900 hover:bg-slate-700"
              }`}
              style={{
                left: `${left * keyWidth}%`,
                width: `${keyWidth * 0.6}%`,
                height: "100%",
              }}
            >
              {showLabels && (
                <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/80">
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
