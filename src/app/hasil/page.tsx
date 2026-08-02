import { HasilChecker } from "@/components/hasil/HasilChecker";
import { CONFIG } from "@/lib/constants";

export const metadata = { title: "Hasil - Rekrutmen Bareskrim Polri RP" };

export default function ResultPage() {
  return <HasilChecker kkm={CONFIG.kkm} />;
}
