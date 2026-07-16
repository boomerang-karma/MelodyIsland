"use client";

import {
  companionEmoji,
  MOOD_LABELS,
} from "@/modules/companion";
import type { CompanionMood, CompanionState } from "@/modules/core";

export function CompanionBubble({
  companion,
  mood,
  large,
}: {
  companion: CompanionState;
  mood?: CompanionMood;
  large?: boolean;
}) {
  const m = mood ?? companion.mood;
  const emoji = companionEmoji({ ...companion, mood: m });
  return (
    <div className="flex items-end gap-3">
      <div
        className={`${large ? "text-7xl" : "text-5xl"} drop-shadow-lg animate-bounce`}
        style={{ animationDuration: m === "dance" ? "0.5s" : m === "yawn" ? "2.5s" : "1.2s" }}
        aria-hidden
      >
        {emoji}
      </div>
      <div className="relative max-w-xs rounded-2xl bg-white text-slate-800 px-4 py-3 shadow-lg">
        <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
        <p className="font-semibold text-sm text-violet-600">{companion.name}</p>
        <p className="text-sm leading-snug">
          {companion.name} {MOOD_LABELS[m]}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Lv {companion.level} · Stage {companion.evolutionStage}
        </p>
      </div>
    </div>
  );
}
