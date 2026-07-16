import type { NoteName, Octave, Pitch } from "./types";

const NOTE_NAMES: NoteName[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** A4 = 440 Hz standard */
export function frequencyToMidi(hz: number): number {
  return Math.round(69 + 12 * Math.log2(hz / 440));
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToPitch(midi: number): Pitch {
  const clamped = Math.max(12, Math.min(108, midi));
  const note = NOTE_NAMES[((clamped % 12) + 12) % 12];
  const octave = (Math.floor(clamped / 12) - 1) as Octave;
  return {
    note,
    octave,
    midi: clamped,
    frequencyHz: midiToFrequency(clamped),
  };
}

export function frequencyToPitch(hz: number): Pitch {
  return midiToPitch(frequencyToMidi(hz));
}

export function pitchLabel(p: Pitch): string {
  return `${p.note}${p.octave}`;
}

export function pitchEquals(a: Pitch, b: Pitch, allowOctave = false): boolean {
  if (allowOctave) return a.note === b.note;
  return a.midi === b.midi;
}

export function isBlackKey(note: NoteName): boolean {
  return note.includes("#");
}

export function parsePitch(label: string): Pitch {
  const match = label.match(/^([A-G]#?)(\d)$/);
  if (!match) throw new Error(`Invalid pitch: ${label}`);
  const note = match[1] as NoteName;
  const octave = Number(match[2]) as Octave;
  const midi = (octave + 1) * 12 + NOTE_NAMES.indexOf(note);
  return { note, octave, midi, frequencyHz: midiToFrequency(midi) };
}

export { NOTE_NAMES };
