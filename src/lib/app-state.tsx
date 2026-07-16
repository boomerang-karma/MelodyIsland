"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ActivityResult, ProgressSnapshot } from "@/modules/core";
import {
  applyActivityResult,
  buildParentSummary,
  clearProgress,
  defaultProgress,
  loadProgress,
  recordSessionMinutes,
  saveProgress,
} from "@/modules/progress";
import { createCompanion } from "@/modules/companion";
import { SkillModel } from "@/modules/skill-model";
import { SessionDirector } from "@/modules/session";

interface AppStateValue {
  ready: boolean;
  progress: ProgressSnapshot | null;
  skillModel: SkillModel;
  director: SessionDirector;
  hasProfile: boolean;
  createProfile: (opts: {
    nickname: string;
    avatarEmoji: string;
    speciesId: string;
    companionName: string;
  }) => void;
  completeActivity: (result: ActivityResult) => void;
  finishSession: (minutes: number, starsEarned: number) => void;
  setCurrentIsland: (id: number) => void;
  resetAll: () => void;
  parentSummary: ReturnType<typeof buildParentSummary> | null;
  syncToCloud: () => Promise<{ ok: boolean; message: string }>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const skillModel = useMemo(() => new SkillModel(), []);
  const director = useMemo(() => new SessionDirector(), []);

  useEffect(() => {
    const loaded = loadProgress();
    if (loaded) {
      setProgress(loaded);
      skillModel.load(loaded.skillMastery);
    }
    setReady(true);
  }, [skillModel]);

  const persist = useCallback(
    (next: ProgressSnapshot) => {
      setProgress(next);
      saveProgress(next);
      skillModel.load(next.skillMastery);
    },
    [skillModel],
  );

  const createProfile = useCallback(
    (opts: {
      nickname: string;
      avatarEmoji: string;
      speciesId: string;
      companionName: string;
    }) => {
      const snap = defaultProgress({
        nickname: opts.nickname,
        avatarEmoji: opts.avatarEmoji,
        companion: createCompanion(opts.speciesId, opts.companionName),
      });
      persist(snap);
    },
    [persist],
  );

  const completeActivity = useCallback(
    (result: ActivityResult) => {
      if (!progress) return;
      const next = applyActivityResult(progress, result);
      persist(next);
    },
    [progress, persist],
  );

  const finishSession = useCallback(
    (minutes: number, starsEarned: number) => {
      if (!progress) return;
      const next = recordSessionMinutes(progress, minutes, starsEarned);
      persist(next);
      director.endSession(minutes);
    },
    [progress, persist, director],
  );

  const setCurrentIsland = useCallback(
    (id: number) => {
      if (!progress) return;
      if (!progress.unlockedIslandIds.includes(id)) return;
      persist({ ...progress, currentIslandId: id });
    },
    [progress, persist],
  );

  const resetAll = useCallback(() => {
    clearProgress();
    setProgress(null);
    skillModel.load({});
  }, [skillModel]);

  const parentSummary = useMemo(
    () => (progress ? buildParentSummary(progress) : null),
    [progress],
  );

  const syncToCloud = useCallback(async () => {
    if (!progress) return { ok: false, message: "No profile to sync" };
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (!res.ok) throw new Error(await res.text());
      return { ok: true, message: "Progress synced to the cloud." };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Sync failed",
      };
    }
  }, [progress]);

  const value: AppStateValue = {
    ready,
    progress,
    skillModel,
    director,
    hasProfile: !!progress,
    createProfile,
    completeActivity,
    finishSession,
    setCurrentIsland,
    resetAll,
    parentSummary,
    syncToCloud,
  };

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
