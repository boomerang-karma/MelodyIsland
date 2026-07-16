# "Melody Islands" — Piano Learning App for Kids (Age ~7)

iPad-first product: the tablet sits on the piano, listens through the mic, and turns a 10-level curriculum into an island-hopping adventure. Adaptive difficulty, real metrics for parents, playful everything for the kid.

---

## 1. Vision

Existing apps (Simply Piano, Yousician) skew older or drill-heavy. This app is built for a 7-year-old's world: 5–10 minute sessions, a story to care about, a companion who celebrates every win, and a curriculum grounded in proven method-book pedagogy (Faber Piano Adventures / Bastien progression: black keys → finger numbers → guide notes → staff reading → five-finger positions → hands together).

## 2. Design Principles for Age 7

- **Sessions are 5–10 minutes**, ending on a win. The app suggests stopping, never punishes leaving.
- **Audio-first instructions** — a character speaks; minimal reading required (they're still learning to read English too).
- **Instant, specific, kind feedback** — wrong notes get "so close! try the key next door," never a red X buzzer.
- **Real instrument from day one** — mic-based note detection on any piano/keyboard (MIDI supported as a bonus, on-screen keys only for note-naming games, never for playing credit).
- **Kid sees fun, parent sees data.** Two entirely different surfaces on the same events.

## 3. The Playful World

- **10 islands = 10 levels.** Each island has a theme, a guide character, ~8–12 activities, and a **Boss Song** performed to unlock the boat to the next island.
- **Companion:** a small creature (kid picks at onboarding) that dances to correct rhythm, yawns if tempo drags, and grows/evolves with mastery.
- **Collection mechanics:** stars per activity (1–3), instrument stickers, animal band members recruited per island — the kid assembles an orchestra across the game.
- **Recital mode:** after each boss song, a virtual concert — companion audience, applause, shareable "concert poster" (parent-gated sharing).
- **Free Play sandbox:** always unlocked; the app names whatever notes it hears and can add drum backing — no goals, pure exploration.

## 4. The 10-Level Curriculum

| Level / Island | Core skills | Boss Song (example) |
|---|---|---|
| **1. Drum Jungle** | Keyboard geography, 2/3 black-key groups, finger numbers, high/low, loud/soft, steady beat tapping | "Jungle Beat" (black keys only) |
| **2. Letter Beach** | White key names A–G, Middle C home base, quarter/half/whole note rhythms (clap & play) | "C is for Castle" |
| **3. Five-Finger Cove** | Pre-staff notation, RH C-position five-finger melodies, LH intro | "Ode to Joy" (RH, pre-staff) |
| **4. Staff Mountain** | The grand staff, guide notes (Middle C, Treble G, Bass F), reading steps up/down | "Mountain Climber" |
| **5. Melody Meadow** | Steps & skips on staff, 9-note Middle-C range, hands take turns, 4/4 vs 3/4 | "Twinkle Variations" |
| **6. Two-Hands Harbor** | Simple hands-together, ties, dotted half notes, phrase breathing | "Row Your Boat" (hands together) |
| **7. Sharp Peaks** | G position, first sharps/flats, eighth notes, tempo words (allegro/adagio) | "Frozen Peak March" |
| **8. Chord Canyon** | Broken & blocked triads (C, F, G), dynamics p/mf/f, legato vs staccato | "Canyon Echo" (melody + chords) |
| **9. Scale Falls** | C & G scales one octave, LH accompaniment patterns, rests, simple sight-reading intro | "Waterfall Run" |
| **10. Concert City** | Full two-hand pieces, expression, memorization of one piece, daily sight-reading snack | Graduation recital: 3-song set |

Each level's skills are decomposed into **micro-skills** (e.g., "names D on sight <2s", "plays quarter-note line at 80bpm ±80ms") — the unit of the adaptive engine.

## 5. Adaptivity Engine

- **Skill model:** every micro-skill tracked with a mastery score (Bayesian Knowledge Tracing-style: updates on each attempt, decays over time).
- **Dynamic difficulty inside activities:** tempo scales ±20%, hand isolation on/off, note labels fade in/out, phrase length shrinks — the same song serves many skill states.
- **Frustration guardrail:** 3 misses on the same passage → app switches to a lighter remediation game targeting that exact micro-skill (e.g., a note-naming race for the note being missed), then returns.
- **Spaced review:** warm-ups each session are drawn from mastered-but-decaying skills (2 min of review disguised as "sound check with your band").
- **Pace, not gates:** a fast learner can pass a level check-in early; a slower one gets extra auto-generated activities without the level count ever feeling like failure.

## 6. Activity Types

Play-along songs (falling-note highway with a **sheet-music toggle** — notation is always visible, growing more prominent per level), echo/ear games (hear it → play it), rhythm tap games (whole-body: tap the tablet, clap detection via mic), note-naming races, boss songs, and free play. Every activity type feeds the same skill model.

## 7. Metrics

**Kid-facing (playful):** stars, streaks ("practice flame"), band members collected, concert posters. Never percentages, never comparisons to other kids.

**Parent dashboard:**

- Practice consistency: sessions/week, minutes, streak calendar
- Note accuracy % and **timing precision** (avg ms offset from beat) per song and trend
- Skill radar: reading, rhythm, ear, technique, hands-together
- Per-micro-skill mastery heatmap + "what to encourage this week" plain-language summary
- Level progress and boss-song recordings (audio clips of their kid playing — the retention killer feature for parents)

## 8. Note-Detection Tech (the hard part)

- **Monophonic detection** (levels 1–5): onset detection + YIN/pYIN pitch tracking — robust, low-latency, well-understood.
- **Polyphonic** (levels 6+, hands together/chords): on-device ML transcription (Basic Pitch-class model, Core ML), scored against expected notes with tolerance windows.
- **Calibration ritual:** first-run "tune your stage" — kid plays 5 prompted keys; app learns the instrument's tuning offset, room noise floor, and latency. Re-runs silently when confidence drops.
- Latency budget <120ms mic-to-feedback; scoring uses timestamps, not real-time gating, so feedback stays fair.
- **MIDI over USB/Bluetooth** supported from day one (it's cheap once the scoring layer is input-agnostic) — input adapter pattern: `MicInput | MidiInput | TouchInput → NoteEvent stream → Scorer`.

## 9. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Native iPad: Swift + SwiftUI, SpriteKit for game scenes** | Audio latency is the product risk; native AVAudioEngine/AudioKit is the safe path. Android port in phase 4 (Oboe library). |
| Pitch ML | Core ML (converted Basic Pitch-class model) + custom DSP (accelerate/vDSP) | On-device: no audio leaves the iPad — big COPPA/privacy win |
| Content | Songs authored as **MusicXML + metadata JSON** (skills taught, tempo range, splits) | One source renders notation, falling notes, and scoring targets |
| Backend | Firebase or Supabase: parent auth, kid profiles (nickname + avatar only, no PII), progress sync | Kid profiles hang off parent account — COPPA-aligned |
| Compliance | Parental gate, no ads, no third-party trackers, kidSAFE certification pre-launch | Non-negotiable for a kids' product |
| Analytics | Self-hosted/privacy-safe (PostHog) with COPPA review | Product iteration without selling out the audience |

## 10. Architecture

Event-driven core: every detected note becomes a `NoteEvent` → `Scorer` compares to the expected track → emits `AttemptResult` → updates **Skill Model** → **Session Director** picks the next activity (curriculum position + mastery gaps + frustration state). Content is data, not code: new songs and activities ship without app updates. All rows carry `child_profile_id` from day one.

## 11. Roadmap

**Phase 0 — Risk spike (3 wks):** mic detection prototype on 3 real instruments (acoustic upright, cheap keyboard, digital piano) + one playable falling-note activity. *Exit: ≥95% mono accuracy, <120ms latency on all three.*

**Phase 1 — MVP, Islands 1–3 (10 wks):** full core loop — world map, companion, 3 islands (~30 activities), monophonic scoring, stars/streaks, basic parent dashboard, local profiles. TestFlight with 10–15 families. *Exit: kids average 3+ sessions/week unprompted in week 3.*

**Phase 2 — Islands 4–7 + adaptivity v2 (10 wks):** staff reading levels, skill-model-driven session director, remediation games, spaced review, parent accounts + sync, boss-song audio recordings.

**Phase 3 — Islands 8–10 + launch (8 wks):** polyphonic scoring, chords/scales content, recital mode, kidSAFE/COPPA certification, App Store launch, subscription billing (parent-gated).

**Phase 4 — Growth:** Android (Oboe audio), sibling profiles, teacher mode (assign songs, see class dashboard), seasonal island events.

## 12. Risks

- **Polyphonic mic detection on out-of-tune acoustic pianos** is the #1 technical risk → phase 0 spike, calibration ritual, generous scoring tolerance, MIDI as the precision path.
- **Novelty decay after week 2** → companion evolution, collection depth, and fresh weekly content matter more than level count; boss-song recordings give parents a reason to keep it going.
- **Kid abandons when it gets hard (level 6, hands together)** → the frustration guardrail and hand-isolation scaffolding exist precisely for this cliff.
- **COPPA missteps are existential** for a kids' product → compliance is a launch gate, not a cleanup task.

## 13. Success Metrics

Learning: 80% of active kids pass Level 5 (real staff reading) within 6 months; timing precision improves ≥30% from level 1 baseline. Product: D30 >25%, 3+ sessions/kid/week, trial→paid >8%, parent NPS >50.

---

*Pedagogy grounded in standard beginner progressions: [Faber Piano Adventures Primer](https://pianoadventures.com/piano-books/basic-piano-adventures/primer/q-and-a/), [Piano Adventures Level 1](https://pianoadventures.com/piano-books/basic-piano-adventures/level-1/q-and-a/), [method comparison — young beginners](https://thetattooedpianoteacher.com/piano-method-young-beginners/), [Bastien Piano Basics](https://www.rainbowresource.com/bastien-piano-basics-method).*
