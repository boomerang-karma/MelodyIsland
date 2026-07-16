import type { SongTrack } from "@/modules/core";
import { getCurriculumSong, SONGS } from "./songs";
import { FAMOUS_SONGS, getFamousSong } from "./famous-tunes";

/** Resolve any song id (island curriculum or famous tunes). */
export function getSong(id: string): SongTrack | undefined {
  return getCurriculumSong(id) ?? getFamousSong(id);
}

export function allSongs(): SongTrack[] {
  return [...SONGS, ...FAMOUS_SONGS];
}
