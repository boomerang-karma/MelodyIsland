/**
 * Progress persistence — localStorage client + API-shaped payload for Azure sync.
 * Kid profiles: nickname + avatar only (COPPA-aligned; no PII).
 */

import type {
  ActivityResult,
  KidProfile,
  ParentSummary,
  ProgressSnapshot,
  SkillCategory,
} from "@/modules/core";
import { BAND_MEMBERS, ISLANDS, MICRO_SKILLS, getIsland } from "@/modules/curriculum";
import { createCompanion, addCompanionXp } from "@/modules/companion";
import { nextIslandUnlock } from "@/modules/session";
import { SkillModel } from "@/modules/skill-model";

const STORAGE_KEY = "melody-islands-progress-v1";

export function defaultProgress(profile?: Partial<KidProfile>): ProgressSnapshot {
  const companion = createCompanion(
    profile?.companion?.speciesId ?? "melody-moth",
    profile?.companion?.name,
  );
  const kid: KidProfile = {
    id: profile?.id ?? `kid-${Date.now()}`,
    nickname: profile?.nickname ?? "Player",
    avatarEmoji: profile?.avatarEmoji ?? "🎹",
    companion: profile?.companion ?? companion,
    createdAt: profile?.createdAt ?? new Date().toISOString(),
  };

  return {
    profile: kid,
    currentIslandId: 1,
    unlockedIslandIds: [1],
    activityStars: {},
    skillMastery: {},
    bandMembers: [],
    stickers: [],
    practiceFlame: 0,
    totalSessions: 0,
    totalMinutes: 0,
    sessionHistory: [],
    bossRecordings: [],
  };
}

export function loadProgress(): ProgressSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProgressSnapshot;
  } catch {
    return null;
  }
}

export function saveProgress(snapshot: ProgressSnapshot): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function applyActivityResult(
  snapshot: ProgressSnapshot,
  result: ActivityResult,
): ProgressSnapshot {
  const next = structuredClone(snapshot);
  const prevStars = next.activityStars[result.activityId] ?? 0;
  if (result.stars > prevStars) {
    next.activityStars[result.activityId] = result.stars;
  }

  const model = new SkillModel();
  model.load(next.skillMastery);
  Object.entries(result.skillDeltas).forEach(([skillId, delta]) => {
    model.observe(skillId, delta > 0);
  });
  // Also feed raw attempts if skillDeltas empty
  if (!Object.keys(result.skillDeltas).length && result.attempts.length) {
    const hits = result.attempts.filter((a) => a.hit).length;
    const correct = hits >= result.attempts.length * 0.5;
    result.attempts[0]?.skillIds.forEach((id) => model.observe(id, correct));
  }
  next.skillMastery = model.snapshot();

  next.profile.companion = addCompanionXp(
    next.profile.companion,
    result.stars * 10 + Math.round(result.accuracy * 15),
  );

  // Boss unlock
  const activityIsland = Object.values(next.activityStars);
  void activityIsland;
  for (const island of ISLANDS) {
    if (
      next.unlockedIslandIds.includes(island.id) &&
      nextIslandUnlock(island.id, next.activityStars)
    ) {
      const nextId = island.id + 1;
      if (nextId <= 10 && !next.unlockedIslandIds.includes(nextId)) {
        next.unlockedIslandIds.push(nextId);
        next.currentIslandId = nextId;
        const member = BAND_MEMBERS[island.id];
        if (member && !next.bandMembers.includes(member.id)) {
          next.bandMembers.push(member.id);
          next.stickers.push(`${member.emoji} ${member.name}`);
        }
      }
    }
  }

  // Boss recording stub
  if (result.activityId.includes("boss") && result.stars >= 1) {
    next.bossRecordings.push({
      activityId: result.activityId,
      at: result.completedAt,
      note: `${result.stars}★ performance`,
    });
  }

  return next;
}

export function recordSessionMinutes(
  snapshot: ProgressSnapshot,
  minutes: number,
  starsEarned: number,
): ProgressSnapshot {
  const next = structuredClone(snapshot);
  const today = new Date().toISOString().slice(0, 10);
  next.totalSessions += 1;
  next.totalMinutes += minutes;
  const last = next.sessionHistory[next.sessionHistory.length - 1];
  if (last?.date === today) {
    last.minutes += minutes;
    last.starsEarned += starsEarned;
  } else {
    next.sessionHistory.push({ date: today, minutes, starsEarned });
  }
  // Streak
  next.practiceFlame = computeStreak(next.sessionHistory);
  return next;
}

function computeStreak(
  history: { date: string; minutes: number }[],
): number {
  if (!history.length) return 0;
  const days = new Set(history.map((h) => h.date));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (streak === 0) {
      // allow missing today — check yesterday
      d.setDate(d.getDate() - 1);
      const y = d.toISOString().slice(0, 10);
      if (days.has(y)) {
        streak++;
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    } else break;
  }
  return streak;
}

export function buildParentSummary(snapshot: ProgressSnapshot): ParentSummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = snapshot.sessionHistory.filter(
    (s) => new Date(s.date).getTime() >= weekAgo,
  );
  const model = new SkillModel();
  model.load(snapshot.skillMastery);
  const catMap: Record<string, string> = {};
  MICRO_SKILLS.forEach((s) => {
    catMap[s.id] = s.category;
  });
  const averages = model.categoryAverages(catMap);
  const categories: SkillCategory[] = [
    "reading",
    "rhythm",
    "ear",
    "technique",
    "hands_together",
  ];
  const skillRadar = Object.fromEntries(
    categories.map((c) => [c, Math.round((averages[c] ?? 0.15) * 100)]),
  ) as Record<SkillCategory, number>;

  const starVals = Object.values(snapshot.activityStars);
  const noteAccuracy = starVals.length
    ? Math.round(
        (starVals.reduce((a, b) => a + b, 0 as number) /
          (starVals.length * 3)) *
          100,
      )
    : 0;

  const weak = model.weakest(1)[0];
  const weakSkill = weak
    ? MICRO_SKILLS.find((s) => s.id === weak.skillId)
    : null;
  const encouragement = weakSkill
    ? `This week, celebrate progress on “${weakSkill.name}” — short, playful reps work best for age 7.`
    : "Keep sessions short and end on a win. You're building a lovely practice habit!";

  const levelProgress = snapshot.unlockedIslandIds.map((id) => {
    const island = getIsland(id)!;
    const acts = island.activityIds.filter((a) => !a.includes("coming-soon"));
    const done = acts.filter((a) => (snapshot.activityStars[a] ?? 0) >= 1).length;
    return {
      islandId: id,
      name: island.name,
      percent: acts.length ? Math.round((done / acts.length) * 100) : 0,
    };
  });

  return {
    sessionsThisWeek: weekSessions.length,
    totalMinutes: snapshot.totalMinutes,
    streakDays: snapshot.practiceFlame,
    noteAccuracy,
    avgTimingMs: 90, // filled from live session metrics when synced
    skillRadar,
    encouragement,
    levelProgress,
  };
}
