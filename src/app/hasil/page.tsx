import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLatestResult } from "@/lib/exam-service";
import { CONFIG } from "@/lib/constants";
import { ResultCard } from "@/components/result/ResultCard";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = { title: "Hasil - Rekrutmen Bareskrim Polri RP" };

export default async function ResultPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const result = await getLatestResult(user.id);
  if (!result) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <Card strong className="w-full max-w-md p-8 text-center">
          <div className="text-4xl">📄</div>
          <h1 className="mt-4 font-display text-xl font-bold gold-text">Belum Ada Hasil</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Anda belum pernah mengikuti ujian pada periode rekrutmen ini.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <button className="rounded-lg border border-gold/40 bg-gradient-to-r from-gold-300 via-gold to-gold-600 px-6 py-2.5 text-sm font-semibold text-crimson-950 shadow-glow transition hover:brightness-110">
              Mulai Ujian
            </button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-hero-radial px-4 py-10">
      <ResultCard
        kkm={CONFIG.kkm}
        result={{
          id: result.id,
          score: result.score,
          maxScore: result.maxScore,
          mcqScore: result.mcqScore,
          essayScore: result.essayScore,
          status: result.status,
          passed: result.passed,
          submittedAt: result.submittedAt.toISOString(),
          answersJson: result.answersJson as never,
          attempt: {
            id: result.attemptId,
            user: {
              username: result.attempt.user.username,
              displayName: result.attempt.user.displayName,
              robloxId: result.attempt.user.robloxId,
              avatarUrl: result.attempt.user.avatarUrl,
              policeGroupRank: result.attempt.user.policeGroupRank,
            },
            period: { name: result.attempt.period.name },
          },
        }}
      />
    </div>
  );
}
