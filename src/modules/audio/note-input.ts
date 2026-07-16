/**
 * Input adapter pattern:
 *   MicInput | MidiInput | TouchInput → NoteEvent stream → Scorer
 *
 * Enhance module-by-module: replace MicNoteInput internals with
 * WASM Basic Pitch or WebMIDI without changing consumers.
 */

import {
  bus,
  frequencyToPitch,
  midiToPitch,
  type NoteEvent,
} from "@/modules/core";
import { yinDetect } from "./yin";

export interface NoteInput {
  readonly source: NoteEvent["source"];
  start(): Promise<void>;
  stop(): void;
  onNote(handler: (e: NoteEvent) => void): () => void;
}

let noteSeq = 0;
function makeId(): string {
  return `note-${Date.now()}-${++noteSeq}`;
}

type NoteHandler = (e: NoteEvent) => void;

abstract class BaseInput implements NoteInput {
  abstract readonly source: NoteEvent["source"];
  protected handlers = new Set<NoteHandler>();
  protected running = false;

  onNote(handler: NoteHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  protected emit(event: NoteEvent): void {
    this.handlers.forEach((h) => h(event));
    bus.emit("note:detected", event);
  }

  abstract start(): Promise<void>;
  abstract stop(): void;
}

/** Microphone pitch tracking via Web Audio + YIN */
export class MicNoteInput extends BaseInput {
  readonly source = "mic" as const;
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private lastMidi: number | null = null;
  private lastOnset = 0;
  private silenceFrames = 0;
  /** Tuning offset in cents (from calibration) */
  tuningOffsetCents = 0;
  private noiseFloor = 0.01;

  async start(): Promise<void> {
    if (this.running) return;
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      throw new Error("Microphone not available in this environment");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.audioCtx = new AudioContext();
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);
    // ScriptProcessor is deprecated but widely supported; enhance → AudioWorklet module later
    this.processor = this.audioCtx.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (ev) => {
      const input = ev.inputBuffer.getChannelData(0);
      let rms = 0;
      for (let i = 0; i < input.length; i++) rms += input[i] * input[i];
      rms = Math.sqrt(rms / input.length);

      if (rms < this.noiseFloor * 1.5) {
        this.silenceFrames++;
        if (this.silenceFrames > 4) this.lastMidi = null;
        return;
      }
      this.silenceFrames = 0;

      const result = yinDetect(input, this.audioCtx!.sampleRate, 0.15);
      if (!result.frequencyHz || result.confidence < 0.6) return;

      const adjustedHz =
        result.frequencyHz * Math.pow(2, this.tuningOffsetCents / 1200);
      const pitch = frequencyToPitch(adjustedHz);

      const now = performance.now();
      if (this.lastMidi === pitch.midi && now - this.lastOnset < 180) {
        return;
      }
      this.lastMidi = pitch.midi;
      this.lastOnset = now;

      this.emit({
        id: makeId(),
        pitch,
        onsetMs: now,
        velocity: Math.min(1, rms * 8),
        source: "mic",
        confidence: result.confidence,
      });
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    this.running = true;
  }

  setCalibration(opts: { tuningOffsetCents?: number; noiseFloor?: number }) {
    if (opts.tuningOffsetCents != null)
      this.tuningOffsetCents = opts.tuningOffsetCents;
    if (opts.noiseFloor != null) this.noiseFloor = opts.noiseFloor;
  }

  stop(): void {
    this.running = false;
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.audioCtx?.close();
    this.processor = null;
    this.sourceNode = null;
    this.stream = null;
    this.audioCtx = null;
  }
}

/** On-screen keyboard for note-naming games (policy: optional credit) */
export class TouchNoteInput extends BaseInput {
  readonly source = "touch" as const;

  async start(): Promise<void> {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  press(midi: number, velocity = 0.8): void {
    if (!this.running) return;
    this.emit({
      id: makeId(),
      pitch: midiToPitch(midi),
      onsetMs: performance.now(),
      velocity,
      source: "touch",
      confidence: 1,
    });
  }
}

/** MIDI adapter — Web MIDI API */
export class MidiNoteInput extends BaseInput {
  readonly source = "midi" as const;
  private access: MIDIAccess | null = null;

  async start(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      throw new Error("Web MIDI not supported");
    }
    this.access = await navigator.requestMIDIAccess();
    this.access.inputs.forEach((input) => {
      input.onmidimessage = (msg) => this.handleMessage(msg);
    });
    this.running = true;
  }

  private handleMessage(msg: MIDIMessageEvent): void {
    const data = msg.data;
    if (!data || data.length < 3) return;
    const status = data[0] & 0xf0;
    const note = data[1];
    const vel = data[2];
    if (status === 0x90 && vel > 0) {
      this.emit({
        id: makeId(),
        pitch: midiToPitch(note),
        onsetMs: performance.now(),
        velocity: vel / 127,
        source: "midi",
        confidence: 1,
      });
    }
  }

  stop(): void {
    this.running = false;
    this.access?.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    this.access = null;
  }
}

/** Web Audio synth for app-generated demo tones */
export function playTone(
  frequencyHz: number,
  durationMs = 400,
  velocity = 0.3,
): void {
  if (typeof window === "undefined") return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = frequencyHz;
  gain.gain.value = velocity;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + durationMs / 1000,
  );
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  osc.onended = () => void ctx.close();
}
