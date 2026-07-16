"use client";

import Link from "next/link";
import { ISLANDS } from "@/modules/curriculum";
import type { ProgressSnapshot } from "@/modules/core";
import { Card } from "./ui/Card";

export function WorldMap({
  progress,
  onSelectIsland,
}: {
  progress: ProgressSnapshot;
  onSelectIsland: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {ISLANDS.map((island) => {
        const unlocked = progress.unlockedIslandIds.includes(island.id);
        const active = progress.currentIslandId === island.id;
        const acts = island.activityIds.filter((a) => !a.includes("coming-soon"));
        const stars = acts.reduce(
          (sum, id) => sum + (progress.activityStars[id] ?? 0),
          0,
        );
        const maxStars = acts.length * 3;

        return (
          <Card
            key={island.id}
            className={`p-4 relative overflow-hidden ${!unlocked ? "opacity-50" : ""} ${active ? "ring-2 ring-yellow-300" : ""}`}
            onClick={() => unlocked && onSelectIsland(island.id)}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${island.gradient} opacity-30`}
            />
            <div className="relative">
              <div className="text-4xl mb-2">{unlocked ? island.emoji : "🔒"}</div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {island.id}. {island.name}
              </h3>
              <p className="text-white/70 text-xs mt-1 line-clamp-2">
                {island.theme}
              </p>
              {unlocked && acts.length > 0 && (
                <p className="text-yellow-300 text-xs mt-2">
                  {"★".repeat(Math.min(3, Math.ceil(stars / Math.max(1, acts.length))))}{" "}
                  <span className="text-white/60">
                    {stars}/{maxStars}
                  </span>
                </p>
              )}
              {unlocked && (
                <Link
                  href={`/play/island/${island.id}`}
                  className="mt-3 inline-block text-xs font-semibold text-white underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open island →
                </Link>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
