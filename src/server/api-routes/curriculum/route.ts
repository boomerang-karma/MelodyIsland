import { NextResponse } from "next/server";
import { ACTIVITIES, ISLANDS, MICRO_SKILLS, SONGS } from "@/modules/curriculum";

/** Content-as-data API — clients (and future native apps) can pull curriculum. */
export async function GET() {
  return NextResponse.json({
    islands: ISLANDS.map((i) => ({
      id: i.id,
      name: i.name,
      theme: i.theme,
      emoji: i.emoji,
      activityIds: i.activityIds,
      bossSongId: i.bossSongId,
    })),
    activities: ACTIVITIES,
    skills: MICRO_SKILLS,
    songs: SONGS.map((s) => ({
      id: s.id,
      title: s.title,
      bpm: s.bpm,
      noteCount: s.notes.length,
      skillIds: s.skillIds,
    })),
  });
}
