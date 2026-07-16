"use client";

import Link from "next/link";
import { FAMOUS_TUNES } from "@/modules/curriculum";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function FamousTunesPage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-fuchsia-300/70 text-xs uppercase tracking-widest">
            Learn
          </p>
          <h1 className="text-3xl font-bold text-white">Famous Tunes</h1>
          <p className="text-white/65 text-sm mt-1 max-w-xl">
            Simplified kid-friendly arrangements — including Golden, Takedown,
            and classic favorites. Tap a song, hear a demo, then play along.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/classic">
            <Button variant="secondary" size="sm">
              Classic piano
            </Button>
          </Link>
          <Link href="/play">
            <Button variant="ghost" size="sm">
              Islands
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FAMOUS_TUNES.map((tune) => (
          <Card key={tune.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl" aria-hidden>
                {tune.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-lg leading-tight">
                  {tune.title}
                </h2>
                <p className="text-white/50 text-xs mt-0.5">{tune.artist}</p>
                <p className="text-white/70 text-sm mt-2 line-clamp-2">
                  {tune.blurb}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-yellow-300 text-xs">
                    {"★".repeat(tune.difficulty)}
                    {"☆".repeat(3 - tune.difficulty)} · ~{tune.estimatedMinutes}{" "}
                    min
                  </span>
                  <Link href={`/tunes/${tune.id}/`}>
                    <Button size="sm">Learn</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-white/35 text-xs text-center pb-6">
        Arrangements are simplified for learning and practice — not full
        commercial sheet music.
      </p>
    </main>
  );
}
