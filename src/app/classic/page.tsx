"use client";

import Link from "next/link";
import { ClassicPiano } from "@/components/ClassicPiano";
import { Button } from "@/components/ui/Button";

export default function ClassicPianoPage() {
  return (
    <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-amber-200/60 text-xs uppercase tracking-[0.2em]">
            Mode
          </p>
          <h1 className="text-3xl font-bold text-white">Classic Piano</h1>
          <p className="text-white/60 text-sm mt-1 max-w-xl">
            No islands, no scores — just a beautiful piano. Play free, use the
            mic, or keep time with the metronome.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tunes">
            <Button variant="secondary" size="sm">
              Famous tunes
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Home
            </Button>
          </Link>
        </div>
      </div>

      <ClassicPiano />
    </main>
  );
}
