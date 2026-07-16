import { ACTIVITIES } from "@/modules/curriculum";
import ActivityClient from "./ActivityClient";

/** Required for Next.js static export (Azure Static Web Apps → `out/`) */
export function generateStaticParams() {
  return ACTIVITIES.map((act) => ({
    islandId: String(act.islandId),
    activityId: act.id,
  }));
}

export default function ActivityPage() {
  return <ActivityClient />;
}
