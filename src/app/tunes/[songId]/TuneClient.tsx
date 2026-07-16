"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { getFamousTune } from "@/modules/curriculum";
import { TunePlayer } from "@/components/TunePlayer";
import type { ActivityResult } from "@/modules/core";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TuneClient() {
  const params = useParams();
  const songId = String(params.songId);
  const router = useRouter();
  const { ready, progress, completeActivity } = useAppState();
  const tune = getFamousTune(songId);

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center text-white/70">
        Loading…
      </main>
    );
  }

  if (!tune) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 text-white px-4">
        <p>Tune not found.</p>
        <Link href="/tunes">
          <Button>Back to famous tunes</Button>
        </Link>
      </main>
    );
  }

  function handleComplete(result: ActivityResult) {
    if (progress) completeActivity(result);
  }

  return (
    <main className="flex-1 px-2 sm:px-4 py-3 sm:py-5 max-w-5xl mx-auto w-full">
      <TunePlayer
        tune={tune}
        companion={progress?.profile.companion ?? null}
        onComplete={handleComplete}
        onExit={() => router.push("/tunes/")}
      />
    </main>
  );
}
