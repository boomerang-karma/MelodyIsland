"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MICRO_SKILLS } from "@/modules/curriculum";

/** Simple parental gate — age-appropriate math check (COPPA pattern) */
export default function ParentPage() {
  const { ready, progress, parentSummary, syncToCloud, resetAll } = useAppState();
  const router = useRouter();
  const [gated, setGated] = useState(false);
  const [a] = useState(() => 3 + Math.floor(Math.random() * 5));
  const [b] = useState(() => 4 + Math.floor(Math.random() * 6));
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [syncMsg, setSyncMsg] = useState("");

  if (!ready) return null;
  if (!progress || !parentSummary) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-white">
        <p>No kid profile yet.</p>
        <Link href="/onboarding" className="mt-4">
          <Button>Start onboarding</Button>
        </Link>
      </main>
    );
  }

  if (!gated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <p className="text-4xl">🔒</p>
          <h1 className="text-2xl font-bold text-white">Parent zone</h1>
          <p className="text-white/70 text-sm">
            Grown-ups only. What is {a} + {b}?
          </p>
          <input
            inputMode="numeric"
            className="w-full rounded-xl bg-white/15 border border-white/20 px-4 py-3 text-center text-xl text-white"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          {error && <p className="text-rose-300 text-sm">{error}</p>}
          <Button
            className="w-full"
            onClick={() => {
              if (Number(answer) === a + b) setGated(true);
              else setError("Hmm, try again!");
            }}
          >
            Enter
          </Button>
          <Link href="/play" className="block text-white/50 text-sm">
            Back to kid view
          </Link>
        </Card>
      </main>
    );
  }

  const radar = parentSummary.skillRadar;
  const masteryEntries = Object.values(progress.skillMastery).sort(
    (x, y) => y.pMastery - x.pMastery,
  );

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 max-w-4xl mx-auto w-full space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Parent dashboard</h1>
          <p className="text-white/60 text-sm">
            Kid: {progress.profile.nickname} · data stays local unless you sync
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/play">
            <Button variant="secondary" size="sm">
              Kid view
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const r = await syncToCloud();
              setSyncMsg(r.message);
            }}
          >
            Sync to cloud
          </Button>
        </div>
      </div>
      {syncMsg && (
        <p className="text-sm text-sky-200 bg-sky-500/20 rounded-xl px-3 py-2">
          {syncMsg}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: "Sessions / week", v: parentSummary.sessionsThisWeek },
          { l: "Total minutes", v: parentSummary.totalMinutes },
          { l: "Streak days", v: parentSummary.streakDays },
          { l: "Note accuracy", v: `${parentSummary.noteAccuracy}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p className="text-white/50 text-xs">{m.l}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-white mb-2">What to encourage this week</h2>
        <p className="text-white/80 text-sm leading-relaxed">
          {parentSummary.encouragement}
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-white mb-4">Skill radar</h2>
        <div className="space-y-3">
          {Object.entries(radar).map(([cat, pct]) => (
            <div key={cat}>
              <div className="flex justify-between text-sm text-white/70 mb-1">
                <span className="capitalize">{cat.replace("_", " ")}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-white mb-3">Level progress</h2>
        <div className="space-y-2">
          {parentSummary.levelProgress.map((lp) => (
            <div key={lp.islandId} className="flex items-center gap-3 text-sm">
              <span className="text-white w-36 truncate">
                {lp.islandId}. {lp.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${lp.percent}%` }}
                />
              </div>
              <span className="text-white/60 w-10 text-right">{lp.percent}%</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold text-white mb-3">Micro-skill mastery</h2>
        {masteryEntries.length === 0 ? (
          <p className="text-white/50 text-sm">Complete activities to populate the heatmap.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {masteryEntries.map((m) => {
              const meta = MICRO_SKILLS.find((s) => s.id === m.skillId);
              const pct = Math.round(m.pMastery * 100);
              return (
                <div
                  key={m.skillId}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 flex justify-between gap-2"
                >
                  <span className="text-white/80 text-sm">
                    {meta?.name ?? m.skillId}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      pct >= 70 ? "text-emerald-300" : pct >= 40 ? "text-amber-300" : "text-rose-300"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {progress.bossRecordings.length > 0 && (
        <Card className="p-5">
          <h2 className="font-bold text-white mb-3">Boss song moments</h2>
          <ul className="space-y-2 text-sm text-white/80">
            {progress.bossRecordings.map((r, i) => (
              <li key={i}>
                {new Date(r.at).toLocaleDateString()} — {r.activityId}: {r.note}
              </li>
            ))}
          </ul>
          <p className="text-white/40 text-xs mt-2">
            Audio clip storage is a Phase 2 module enhancement (blob → Azure
            Storage).
          </p>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-bold text-white mb-2">Session calendar</h2>
        <div className="flex flex-wrap gap-2">
          {progress.sessionHistory.slice(-14).map((s) => (
            <div
              key={s.date}
              className="rounded-lg bg-orange-500/20 border border-orange-400/30 px-2 py-1 text-xs text-white"
              title={`${s.minutes} min, ${s.starsEarned} stars`}
            >
              {s.date.slice(5)} · {s.minutes}m
            </div>
          ))}
          {!progress.sessionHistory.length && (
            <p className="text-white/50 text-sm">No sessions logged yet.</p>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Reset all progress on this device?")) {
              resetAll();
              router.push("/");
            }
          }}
        >
          Reset local progress
        </Button>
      </div>
    </main>
  );
}
