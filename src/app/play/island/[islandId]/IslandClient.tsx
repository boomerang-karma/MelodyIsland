"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import {
  activitiesForIsland,
  getIsland,
  BAND_MEMBERS,
} from "@/modules/curriculum";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SessionDirector } from "@/modules/session";

const directorHelper = new SessionDirector();

export default function IslandClient() {
  const params = useParams();
  const islandId = Number(params.islandId);
  const { ready, progress, hasProfile } = useAppState();
  const router = useRouter();
  const island = getIsland(islandId);

  if (!ready) return null;
  if (!hasProfile || !progress) {
    router.replace("/onboarding");
    return null;
  }
  if (!island || !progress.unlockedIslandIds.includes(islandId)) {
    router.replace("/play");
    return null;
  }

  const activities = activitiesForIsland(islandId).filter(
    (a) => !a.id.includes("coming-soon"),
  );
  const member = BAND_MEMBERS[islandId];

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 max-w-3xl mx-auto w-full space-y-6">
      <Link href="/play" className="text-white/60 text-sm hover:text-white">
        ← World map
      </Link>

      <div
        className={`rounded-3xl p-6 bg-gradient-to-br ${island.gradient} shadow-2xl`}
      >
        <div className="text-5xl">{island.emoji}</div>
        <h1 className="text-3xl font-bold text-white mt-2">{island.name}</h1>
        <p className="text-white/90 mt-1">{island.theme}</p>
        <p className="text-white/80 text-sm mt-3">
          Guide: {island.guideEmoji} {island.guideName}
        </p>
        {member && (
          <p className="text-white/80 text-sm mt-1">
            Recruit: {member.emoji} {member.name} (beat the boss song!)
          </p>
        )}
      </div>

      <div>
        <h2 className="text-white font-bold text-lg mb-3">Skills on this island</h2>
        <div className="flex flex-wrap gap-2">
          {island.coreSkills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white/80"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {activities.length === 0 ? (
        <Card className="p-6 text-white/80">
          <p className="text-2xl mb-2">🚧</p>
          <p className="font-semibold">This island is scaffolding for Phase 2+</p>
          <p className="text-sm text-white/60 mt-1">
            Modular content slot — add activities in{" "}
            <code className="text-fuchsia-300">src/modules/curriculum</code>{" "}
            without touching scoring or audio.
          </p>
          <Link href="/play" className="inline-block mt-4">
            <Button variant="secondary">Back to map</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg">Activities</h2>
          {activities.map((act) => {
            const stars = progress.activityStars[act.id] ?? 0;
            const unlocked = directorHelper.isUnlocked(
              act,
              progress.activityStars,
            );
            return (
              <Card key={act.id} className={`p-4 ${!unlocked ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white/50 text-xs uppercase">
                      {act.type.replaceAll("_", " ")} · ~{act.estimatedMinutes}{" "}
                      min
                    </p>
                    <h3 className="text-white font-semibold">{act.title}</h3>
                    <p className="text-yellow-300 text-sm mt-1">
                      {stars > 0 ? "★".repeat(stars) : "○ ○ ○"}
                    </p>
                  </div>
                  {unlocked ? (
                    <Link href={`/play/island/${islandId}/activity/${act.id}/`}>
                      <Button size="sm">Play</Button>
                    </Link>
                  ) : (
                    <span className="text-white/40 text-xs">Locked</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
