import { ISLANDS } from "@/modules/curriculum";
import IslandClient from "./IslandClient";

/** Required for Next.js static export (Azure Static Web Apps → `out/`) */
export function generateStaticParams() {
  return ISLANDS.map((island) => ({ islandId: String(island.id) }));
}

export default function IslandPage() {
  return <IslandClient />;
}
