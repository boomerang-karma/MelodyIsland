import { FAMOUS_TUNES } from "@/modules/curriculum";
import TuneClient from "./TuneClient";

export function generateStaticParams() {
  return FAMOUS_TUNES.map((t) => ({ songId: t.id }));
}

export default function TunePage() {
  return <TuneClient />;
}
