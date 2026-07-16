"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { WorldMap } from "@/components/WorldMap";
import { CompanionBubble } from "@/components/CompanionBubble";
import { Button } from "@/components/ui/Button";
import { BAND_MEMBERS } from "@/modules/curriculum";

export default function PlayHubPage() {
  const { ready, progress, hasProfile, setCurrentIsland, director, skillModel } =
    useAppState();
  const router = useRouter();

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center text-white/70">
        Loading…
      </main>
    );
  }

  if (!hasProfile || !progress) {
    router.replace("/onboarding");
    return null;
  }

  function startSmartSession() {
    if (!progress) return;
    const session = director.startSession({
      currentIslandId: progress.currentIslandId,
      unlockedIslandIds: progress.unlockedIslandIds,
      activityStars: progress.activityStars,
      skillModel,
      maxActivities: 3,
    });
    const first = session.currentActivityId;
    if (first) {
      router.push(
        `/play/island/${progress.currentIslandId}/activity/${first}`,
      );
    } else {
      router.push(`/play/island/${progress.currentIslandId}`);
    }
  }

  const band = progress.bandMembers
    .map((id) => Object.values(BAND_MEMBERS).find((b) => b.id === id))
    .filter(Boolean);

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 max-w-6xl mx-auto w-full space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-white/60 text-sm">
            Hi {progress.profile.avatarEmoji} {progress.profile.nickname}
          </p>
          <h1 className="text-3xl font-bold text-white">World Map</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={startSmartSession}>Today&apos;s adventure</Button>
          <Link href="/free-play">
            <Button variant="secondary">Free Play</Button>
          </Link>
          <Link href="/parent">
            <Button variant="ghost" size="sm">
              Parents
            </Button>
          </Link>
        </div>
      </header>

      <CompanionBubble companion={progress.profile.companion} mood="happy" />

      <div className="flex flex-wrap gap-4 text-sm text-white/80">
        <span className="rounded-full bg-orange-500/30 px-3 py-1">
          🔥 Practice flame: {progress.practiceFlame} day
          {progress.practiceFlame === 1 ? "" : "s"}
        </span>
        <span className="rounded-full bg-yellow-500/20 px-3 py-1">
          ⭐ Stars collected:{" "}
          {Object.values(progress.activityStars).reduce(
            (a, b) => a + b,
            0 as number,
          )}
        </span>
        <span className="rounded-full bg-sky-500/20 px-3 py-1">
          🎸 Band: {band.length}/10
        </span>
      </div>

      {band.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {band.map((m) => (
            <span
              key={m!.id}
              className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              title={m!.name}
            >
              {m!.emoji} {m!.name}
            </span>
          ))}
        </div>
      )}

      <WorldMap progress={progress} onSelectIsland={setCurrentIsland} />

      <p className="text-center text-white/40 text-xs pb-8">
        Tip: aim for 5–10 minutes. The app is happy when you stop on a win.
      </p>
    </main>
  );
}
