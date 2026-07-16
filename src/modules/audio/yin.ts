/**
 * YIN pitch detection (de Cheveigné & Kawahara)
 * Modular DSP — swap for Core ML / Basic Pitch later without touching scorers.
 */

export interface YinResult {
  frequencyHz: number | null;
  confidence: number;
  lag: number;
}

/**
 * Estimate fundamental frequency from a mono float32 buffer.
 * @param sampleRate e.g. 44100
 * @param threshold typically 0.1–0.2 (lower = stricter)
 */
export function yinDetect(
  buffer: Float32Array,
  sampleRate: number,
  threshold = 0.15,
): YinResult {
  const half = Math.floor(buffer.length / 2);
  if (half < 2) {
    return { frequencyHz: null, confidence: 0, lag: 0 };
  }

  // Difference function
  const diff = new Float32Array(half);
  for (let tau = 0; tau < half; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const d = buffer[i] - buffer[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalized difference
  const cmnd = new Float32Array(half);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau < half; tau++) {
    running += diff[tau];
    cmnd[tau] = (diff[tau] * tau) / (running || 1);
  }

  // Absolute threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < half; tau++) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < half && cmnd[tau + 1] < cmnd[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate < 0) {
    // Fallback: global minimum
    let minVal = Infinity;
    let minTau = -1;
    for (let tau = 2; tau < half; tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        minTau = tau;
      }
    }
    if (minVal > 0.5 || minTau < 0) {
      return { frequencyHz: null, confidence: 0, lag: 0 };
    }
    tauEstimate = minTau;
  }

  // Parabolic interpolation
  const x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
  const x2 =
    tauEstimate + 1 < half ? tauEstimate + 1 : tauEstimate;
  let betterTau = tauEstimate;
  if (x0 !== tauEstimate && x2 !== tauEstimate) {
    const s0 = cmnd[x0];
    const s1 = cmnd[tauEstimate];
    const s2 = cmnd[x2];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) {
      betterTau = tauEstimate + (s2 - s0) / denom;
    }
  }

  const frequencyHz = sampleRate / betterTau;
  const confidence = 1 - cmnd[tauEstimate];

  // Piano range roughly A0–C8
  if (frequencyHz < 25 || frequencyHz > 4200) {
    return { frequencyHz: null, confidence: 0, lag: betterTau };
  }

  return { frequencyHz, confidence: Math.max(0, Math.min(1, confidence)), lag: betterTau };
}
