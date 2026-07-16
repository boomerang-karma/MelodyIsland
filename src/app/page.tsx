"use client";

import Link from "next/link";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/Button";
import { companionEmoji } from "@/modules/companion";

export default function HomePage() {
  const { ready, hasProfile, progress } = useAppState();

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center text-white/70">
        Loading your islands…
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="ocean-wave absolute inset-x-0 top-1/3 h-24 pointer-events-none" />
      <p className="text-6xl sm:text-7xl mb-4 drop-shadow-lg">🏝️🎹</p>
      <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
        Melody Islands
      </h1>
      <p className="mt-3 max-w-lg text-lg text-white/75">
        A playful piano adventure for kids around 7. Short sessions, kind
        feedback, real piano via the mic — parents get the real metrics.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
        {hasProfile && progress ? (
          <>
            <Link href="/play">
              <Button size="lg">
                Continue as {progress.profile.nickname}{" "}
                {companionEmoji(progress.profile.companion)}
              </Button>
            </Link>
            <Link href="/parent">
              <Button variant="secondary" size="lg">
                Parent zone
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/onboarding">
            <Button size="lg">Start your adventure</Button>
          </Link>
        )}
        <Link href="/free-play">
          <Button variant="ghost" size="lg">
            Free Play sandbox
          </Button>
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
        {[
          {
            t: "10 islands",
            d: "Black keys → staff reading → recital city. Modular curriculum you can expand song by song.",
            e: "🗺️",
          },
          {
            t: "Listens to your piano",
            d: "Mic + YIN pitch detection, MIDI-ready adapters, kind scoring with timing windows.",
            e: "🎤",
          },
          {
            t: "Kid fun / parent data",
            d: "Stars & companions for kids. Accuracy, streaks, and skill radar for grown-ups.",
            e: "📊",
          },
        ].map((card) => (
          <div
            key={card.t}
            className="rounded-3xl bg-white/10 border border-white/15 p-5 backdrop-blur"
          >
            <div className="text-3xl">{card.e}</div>
            <h2 className="mt-2 font-bold text-white">{card.t}</h2>
            <p className="mt-1 text-sm text-white/70">{card.d}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-xs text-white/40 max-w-md">
        COPPA-minded: kid profile is nickname + avatar only. No ads. Parental
        gate on parent dashboard.
      </p>
    </main>
  );
}
