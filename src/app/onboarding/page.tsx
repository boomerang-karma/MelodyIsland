"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/app-state";
import { COMPANION_SPECIES } from "@/modules/companion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const AVATARS = ["🎹", "🌟", "🦊", "🐸", "🦄", "🐯", "🐼", "🌈"];

export default function OnboardingPage() {
  const { createProfile, hasProfile } = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🎹");
  const [speciesId, setSpeciesId] = useState(COMPANION_SPECIES[0].id);
  const [companionName, setCompanionName] = useState("");

  if (hasProfile) {
    router.replace("/play");
  }

  function finish() {
    createProfile({
      nickname: nickname.trim() || "Explorer",
      avatarEmoji,
      speciesId,
      companionName: companionName.trim(),
    });
    router.push("/play");
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-8 max-w-2xl mx-auto w-full">
      <p className="text-white/50 text-sm mb-2">Step {step + 1} of 3</p>
      <h1 className="text-3xl font-bold text-white mb-6">
        {step === 0 && "What should we call you?"}
        {step === 1 && "Pick your look"}
        {step === 2 && "Choose a companion"}
      </h1>

      {step === 0 && (
        <div className="space-y-4">
          <input
            className="w-full rounded-2xl bg-white/15 border border-white/20 px-4 py-4 text-xl text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-fuchsia-400"
            placeholder="Your nickname (not your real name)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <p className="text-white/50 text-sm">
            We only save a nickname — no full name, email, or birthday on the
            kid profile (COPPA-friendly).
          </p>
          <Button size="lg" onClick={() => setStep(1)} disabled={!nickname.trim()}>
            Next
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatarEmoji(a)}
                className={`text-4xl p-4 rounded-2xl border transition ${
                  avatarEmoji === a
                    ? "bg-white/25 border-yellow-300 scale-105"
                    : "bg-white/10 border-white/15 hover:bg-white/15"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button size="lg" onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {COMPANION_SPECIES.map((s) => (
              <Card
                key={s.id}
                className={`p-4 ${speciesId === s.id ? "ring-2 ring-yellow-300" : ""}`}
                onClick={() => setSpeciesId(s.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{s.emojiStages[0]}</span>
                  <div>
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-sm text-white/70">{s.blurb}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <input
            className="w-full rounded-2xl bg-white/15 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-fuchsia-400"
            placeholder="Name your companion (optional)"
            value={companionName}
            onChange={(e) => setCompanionName(e.target.value)}
            maxLength={16}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button size="lg" onClick={finish}>
              Sail to the islands! ⛵
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
