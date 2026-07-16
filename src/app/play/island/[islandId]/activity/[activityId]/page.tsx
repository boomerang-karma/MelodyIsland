"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { getActivity } from "@/modules/curriculum";
import { ActivityPlayer } from "@/components/ActivityPlayer";
import type { ActivityResult } from "@/modules/core";

export default function ActivityPage() {
  const params = useParams();
  const activityId = String(params.activityId);
  const islandId = Number(params.islandId);
  const { ready, progress, hasProfile, completeActivity } = useAppState();
  const router = useRouter();
  const activity = getActivity(activityId);

  if (!ready) return null;
  if (!hasProfile || !progress) {
    router.replace("/onboarding");
    return null;
  }
  if (!activity || activity.islandId !== islandId) {
    router.replace(`/play/island/${islandId}`);
    return null;
  }

  function handleComplete(result: ActivityResult) {
    completeActivity(result);
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 max-w-3xl mx-auto w-full">
      <ActivityPlayer
        activity={activity}
        companion={progress.profile.companion}
        onComplete={handleComplete}
        onExit={() => router.push(`/play/island/${islandId}`)}
      />
    </main>
  );
}
