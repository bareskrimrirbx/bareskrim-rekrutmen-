// ============================================================
// Exam Service - logika inti (dipakai halaman server & API route)
// ============================================================

import { prisma } from "@/lib/prisma";
import { CONFIG } from "@/lib/constants";
import {
  buildQuestionSet,
  gradeExam,
  sanitizeForClient,
  type ClientQuestion,
  type SnapshotQuestion,
} from "@/lib/grading";
import { sendDiscordExamReport } from "@/lib/discord";
import type { User } from "@prisma/client";

export type ExamSessionResult =
  | { ok: true; attemptId: string; questions: ClientQuestion[]; period: { name: string; description: string | null } }
  | { ok: false; code: "NO_ACTIVE_PERIOD" | "ALREADY_SUBMITTED"; message: string };

// Mulai / lanjutkan sesi ujian untuk user pada periode aktif
export async function startExamSession(user: User): Promise<ExamSessionResult> {
  const period = await prisma.examPeriod.findFirst({
    where: { isActive: true },
    orderBy: { openedAt: "desc" },
  });

  if (!period) {
    return {
      ok: false,
      code: "NO_ACTIVE_PERIOD",
      message: "Periode rekrutmen belum dibuka oleh instruktur.",
    };
  }

  const existing = await prisma.examAttempt.findUnique({
    where: { attemptKey: `${period.id}_${user.id}` },
  });

  if (existing?.submittedAt) {
    return {
      ok: false,
      code: "ALREADY_SUBMITTED",
      message: "Anda sudah mengisi ujian pada periode ini. Hasil akan ditampilkan.",
    };
  }

  // Lanjutkan percobaan yang belum selesai (misal halaman ter-refresh)
  if (existing) {
    return {
      ok: true,
      attemptId: existing.id,
      questions: sanitizeForClient(existing.questionsJson as unknown as SnapshotQuestion[]),
      period: { name: period.name, description: period.description },
    };
  }

  const [mcqs, essays] = await Promise.all([
    prisma.question.findMany({ where: { type: "MCQ", isActive: true } }),
    prisma.question.findMany({ where: { type: "ESSAY", isActive: true } }),
  ]);

  if (mcqs.length < CONFIG.mcqCount || essays.length < CONFIG.essayCount) {
    return {
      ok: false,
      code: "NO_ACTIVE_PERIOD",
      message: "Bank soal belum mencukupi untuk periode ini. Hubungi instruktur.",
    };
  }

  const snapshot = buildQuestionSet(mcqs, essays, period.seed);

  const attempt = await prisma.examAttempt.create({
    data: {
      periodId: period.id,
      userId: user.id,
      attemptKey: `${period.id}_${user.id}`,
      questionsJson: snapshot as unknown as object,
    },
  });

  return {
    ok: true,
    attemptId: attempt.id,
    questions: sanitizeForClient(snapshot),
    period: { name: period.name, description: period.description },
  };
}

export interface SubmitExamInput {
  attemptId: string;
  answers: Array<{ questionId: string; answer: string }>;
}

export type SubmitExamResult =
  | { ok: true; resultId: string }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_SUBMITTED" | "EXPIRED" | "INVALID"; message: string };

// Submit & auto-grade secara server-side, lalu kirim laporan ke Discord
export async function submitExam(
  user: User,
  input: SubmitExamInput
): Promise<SubmitExamResult> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: input.attemptId },
    include: { user: true, period: true },
  });

  if (!attempt || attempt.userId !== user.id) {
    return { ok: false, code: "NOT_FOUND", message: "Sesi ujian tidak ditemukan." };
  }

  if (attempt.submittedAt) {
    return { ok: false, code: "ALREADY_SUBMITTED", message: "Ujian sudah pernah dikumpulkan." };
  }

  const durationMs = CONFIG.examDurationMinutes * 60_000;
  const graceMs = 5 * 60_000;
  if (Date.now() - attempt.startedAt.getTime() > durationMs + graceMs) {
    return { ok: false, code: "EXPIRED", message: "Waktu ujian telah habis." };
  }

  const snapshot = attempt.questionsJson as unknown as SnapshotQuestion[];
  const validIds = new Set(snapshot.map((q) => q.id));

  // Validasi: hanya terima jawaban untuk soal dari snapshot periode ini
  const answersMap: Record<string, string> = {};
  for (const a of input.answers) {
    if (!validIds.has(a.questionId)) continue;
    if (typeof a.answer !== "string") continue;
    answersMap[a.questionId] = a.answer.slice(0, 4000);
  }

  const graded = gradeExam(snapshot, answersMap);

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.examResult.create({
      data: {
        attemptId: attempt.id,
        score: graded.score,
        maxScore: graded.maxScore,
        mcqScore: graded.mcqScore,
        essayScore: graded.essayScore,
        status: graded.status,
        passed: graded.passed,
        answersJson: graded.details as unknown as object,
      },
    });

    for (const d of graded.details) {
      const qid = snapshot.find((s) => s.id === d.questionId)?.id;
      if (!qid) continue;
      await tx.examAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: qid,
          answer: d.userAnswer,
          isCorrect: d.type === "MCQ" ? d.isCorrect : null,
          earnedPoints: d.earned,
        },
      });
    }

    await tx.examAttempt.update({
      where: { id: attempt.id },
      data: { submittedAt: new Date() },
    });

    return created;
  });

  // Kirim laporan real-time ke channel pusdik (tidak memblokir hasil)
  void sendDiscordExamReport({
    username: attempt.user.username,
    displayName: attempt.user.displayName,
    robloxId: attempt.user.robloxId,
    avatarUrl: attempt.user.avatarUrl,
    policeRank: attempt.user.policeGroupRank,
    score: graded.score,
    maxScore: graded.maxScore,
    mcqScore: graded.mcqScore,
    essayScore: graded.essayScore,
    status: graded.status,
    periodName: attempt.period.name,
    details: graded.details,
  });

  return { ok: true, resultId: result.id };
}

export async function getLatestResult(userId: string) {
  return prisma.examResult.findFirst({
    where: { attempt: { userId } },
    include: {
      attempt: {
        include: {
          user: true,
          period: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}
