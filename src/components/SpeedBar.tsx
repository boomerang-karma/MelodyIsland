"use client";

import { speedLabel } from "@/modules/curriculum/tempo";

interface Props {
  /** 0.4–1.25, where 1 = original song tempo */
  value: number;
  onChange: (speed: number) => void;
  disabled?: boolean;
  /** Show compact version */
  compact?: boolean;
}

/**
 * Slow-down bar for learning modes — kids drag left when notes fall too fast.
 */
export function SpeedBar({ value, onChange, disabled, compact }: Props) {
  const pct = Math.round(value * 100);

  return (
    <div
      className={`rounded-2xl border border-sky-400/30 bg-sky-500/10 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <label
          htmlFor="learn-speed"
          className="text-sm font-semibold text-sky-100 flex items-center gap-2"
        >
          <span aria-hidden>🐢</span>
          Practice speed
        </label>
        <span className="text-sm text-white font-medium tabular-nums">
          {speedLabel(value)} · {pct}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg" title="Slower" aria-hidden>
          🐢
        </span>
        <input
          id="learn-speed"
          type="range"
          min={40}
          max={125}
          step={5}
          value={pct}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="flex-1 h-3 accent-sky-400 cursor-pointer disabled:opacity-50"
          aria-valuemin={40}
          aria-valuemax={125}
          aria-valuenow={pct}
          aria-label="Practice speed — slide left to slow down"
        />
        <span className="text-lg" title="Faster" aria-hidden>
          🐇
        </span>
      </div>
      {!compact && (
        <p className="text-white/50 text-xs mt-2">
          Notes falling too fast? Drag toward the turtle. You can go as slow as
          40% — still earns stars the same way!
        </p>
      )}
    </div>
  );
}
