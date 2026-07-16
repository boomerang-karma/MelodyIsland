/**
 * Session Director: curriculum position + mastery gaps + frustration state
 * → next activity. Sessions designed for 5–10 minutes ending on a win.
 */

import { bus, type Activity, type SessionState } from "@/modules/core";
import {
  ACTIVITIES,
  activitiesForIsland,
  getActivity,
} from "@/modules/curriculum";
import type { SkillModel } from "@/modules/skill-model";

export interface DirectorInput {
  currentIslandId: number;
  unlockedIslandIds: number[];
  activityStars: Record<string, 0 | 1 | 2 | 3>;
  skillModel: SkillModel;
  maxActivities?: number;
}

export class SessionDirector {
  private state: SessionState | null = null;

  startSession(input: DirectorInput): SessionState {
    const queue = this.buildQueue(input);
    this.state = {
      id: `sess-${Date.now()}`,
      startedAt: new Date().toISOString(),
      activityQueue: queue,
      currentActivityId: queue[0] ?? null,
      completedActivityIds: [],
      frustrationCount: 0,
      warmUpDone: false,
    };
    return { ...this.state };
  }

  getState(): SessionState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Build a short session:
   * 1. Optional warm-up from decaying skills
   * 2. Next incomplete curriculum activity
   * 3. Optional practice on weak skills
   * End near a boss when ready — always leave a win path.
   */
  buildQueue(input: DirectorInput): string[] {
    const max = input.maxActivities ?? 3;
    const queue: string[] = [];
    const islandActs = activitiesForIsland(input.currentIslandId).filter(
      (a) => a.id !== `i${input.currentIslandId}-coming-soon`,
    );

    // Warm-up: explore or first incomplete light activity
    const decaying = input.skillModel.decayingSkills();
    if (decaying.length) {
      const review = islandActs.find(
        (a) =>
          a.type !== "boss_song" &&
          a.skillIds.some((s) => decaying.some((d) => d.skillId === s)),
      );
      if (review) queue.push(review.id);
    }

    // Curriculum progression
    for (const act of islandActs) {
      if (queue.length >= max) break;
      if (queue.includes(act.id)) continue;
      if (!this.isUnlocked(act, input.activityStars)) continue;
      const stars = input.activityStars[act.id] ?? 0;
      if (stars >= 2 && act.type !== "boss_song") continue; // skip solid mastery
      if (act.type === "boss_song") {
        // Only queue boss when enough island stars
        const others = islandActs.filter((a) => a.type !== "boss_song");
        const ready = others.filter((a) => (input.activityStars[a.id] ?? 0) >= 1);
        if (ready.length < Math.min(3, others.length)) continue;
      }
      queue.push(act.id);
    }

    // Fallback: free explore of current island
    if (!queue.length && islandActs[0]) {
      queue.push(islandActs[0].id);
    }

    return queue.slice(0, max);
  }

  isUnlocked(
    act: Activity,
    stars: Record<string, 0 | 1 | 2 | 3>,
  ): boolean {
    if (!act.requires?.length) return true;
    return act.requires.every((id) => (stars[id] ?? 0) >= 1);
  }

  completeCurrent(stars: 0 | 1 | 2 | 3): string | null {
    if (!this.state?.currentActivityId) return null;
    this.state.completedActivityIds.push(this.state.currentActivityId);
    this.state.frustrationCount = 0;

    const idx = this.state.activityQueue.indexOf(this.state.currentActivityId);
    const next = this.state.activityQueue[idx + 1] ?? null;
    this.state.currentActivityId = next;

    if (stars > 0) {
      bus.emit("companion:mood", { mood: "cheer" });
    }
    return next;
  }

  /** 3 misses on same passage → remediation activity */
  registerMiss(skillId: string): Activity | null {
    if (!this.state) return null;
    this.state.frustrationCount += 1;
    if (this.state.frustrationCount < 3) return null;

    this.state.frustrationCount = 0;
    const remediation = ACTIVITIES.find(
      (a) =>
        a.type === "note_naming" ||
        (a.type === "echo" && a.skillIds.includes(skillId)),
    );
    if (remediation) {
      bus.emit("frustration:triggered", {
        skillId,
        activityId: remediation.id,
      });
      return remediation;
    }
    return null;
  }

  suggestStop(elapsedMinutes: number): boolean {
    // Suggest stopping after 5–10 min — never punish leaving
    return elapsedMinutes >= 8;
  }

  endSession(minutes: number): void {
    if (!this.state) return;
    bus.emit("session:ended", { sessionId: this.state.id, minutes });
    this.state = null;
  }
}

export function nextIslandUnlock(
  islandId: number,
  activityStars: Record<string, 0 | 1 | 2 | 3>,
): boolean {
  const boss = activitiesForIsland(islandId).find((a) => a.type === "boss_song");
  if (!boss) return false;
  return (activityStars[boss.id] ?? 0) >= 1;
}

export function getActivitySafe(id: string): Activity | undefined {
  return getActivity(id);
}
