// ============================================================
// Engine Pengacakan & Auto-Grading (SERVER-SIDE ONLY)
// correctKey / keywords TIDAK PERNAH bocor ke client.
// ============================================================

import type { Question } from "@prisma/client";
import { CONFIG } from "@/lib/constants";

// Deterministic RNG (mulberry32)
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// Snapshot soal (tersimpan di ExamAttempt.questionsJson)
// ============================================================

export interface SnapshotOption {
  key: string;
  text: string;
}

export interface SnapshotQuestion {
  id: string;
  type: "MCQ" | "ESSAY";
  prompt: string;
  points: number;
  options?: SnapshotOption[]; // MCQ
  correctKey?: string; // MCQ - SERVER ONLY
  keywords?: string[]; // ESSAY - SERVER ONLY
}

// Versi yang aman dikirim ke client (tanpa correctKey/keywords)
export type ClientQuestion = Omit<SnapshotQuestion, "correctKey" | "keywords">;

function toSnapshot(q: Question, rng: () => number): SnapshotQuestion {
  if (q.type === "ESSAY") {
    return {
      id: q.id,
      type: "ESSAY",
      prompt: q.prompt,
      points: q.points,
      keywords: (q.keywords as unknown as string[]) ?? [],
    };
  }

  const rawOptions = (q.options as unknown as Array<{ key: string; text: string }>) ?? [];
  const shuffled = seededShuffle(rawOptions, rng);
  const presented: SnapshotOption[] = shuffled.map((opt, idx) => ({
    key: String.fromCharCode(65 + idx),
    text: opt.text,
  }));
  const correctIdx = shuffled.findIndex((opt) => opt.key === q.correctKey);

  return {
    id: q.id,
    type: "MCQ",
    prompt: q.prompt,
    points: q.points,
    options: presented,
    correctKey: correctIdx >= 0 ? presented[correctIdx].key : undefined,
  };
}

// Bangun 15 MCQ + 5 Essay acak dari bank soal, dicampur urutannya, oleh seed periode.
export function buildQuestionSet(
  mcqs: Question[],
  essays: Question[],
  seed: number
): SnapshotQuestion[] {
  const rng = mulberry32(seed);
  const mcqPick = seededShuffle(mcqs, rng).slice(0, CONFIG.mcqCount);
  const essayPick = seededShuffle(essays, rng).slice(0, CONFIG.essayCount);
  const all = [...mcqPick, ...essayPick];
  return seededShuffle(all, rng).map((q) => toSnapshot(q, rng));
}

export function sanitizeForClient(snapshot: SnapshotQuestion[]): ClientQuestion[] {
  return snapshot.map(({ correctKey: _ck, keywords: _kw, ...rest }) => rest);
}

// ============================================================
// Auto-Grading
// ============================================================

export interface GradedAnswerDetail {
  questionId: string;
  type: "MCQ" | "ESSAY";
  prompt: string;
  points: number;
  userAnswer: string;
  isCorrect: boolean | null; // null utk essay
  earned: number;
  options?: SnapshotOption[];
  correctKey?: string;
  matchedKeywords?: string[];
}

export interface GradingResult {
  score: number;
  maxScore: number;
  mcqScore: number;
  essayScore: number;
  status: "LULUS" | "TIDAK_LULUS";
  passed: boolean;
  details: GradedAnswerDetail[];
}

export function gradeExam(
  snapshot: SnapshotQuestion[],
  answers: Record<string, string>
): GradingResult {
  let score = 0;
  let maxScore = 0;
  let mcqScore = 0;
  let essayScore = 0;
  const details: GradedAnswerDetail[] = [];

  for (const q of snapshot) {
    const userAnswer = (answers[q.id] ?? "").trim();
    maxScore += q.points;

    if (q.type === "MCQ") {
      const isCorrect = userAnswer.length > 0 && userAnswer === q.correctKey;
      const earned = isCorrect ? q.points : 0;
      score += earned;
      mcqScore += earned;
      details.push({
        questionId: q.id,
        type: "MCQ",
        prompt: q.prompt,
        points: q.points,
        userAnswer,
        isCorrect,
        earned,
        options: q.options,
        correctKey: q.correctKey,
      });
    } else {
      const keywords = q.keywords ?? [];
      const matched = keywords.filter((k) =>
        userAnswer.toLowerCase().includes(k.toLowerCase())
      );
      const earned =
        keywords.length > 0
          ? Math.round((q.points * matched.length) / keywords.length)
          : 0;
      score += earned;
      essayScore += earned;
      details.push({
        questionId: q.id,
        type: "ESSAY",
        prompt: q.prompt,
        points: q.points,
        userAnswer,
        isCorrect: null,
        earned,
        matchedKeywords: matched,
      });
    }
  }

  const passed = score >= CONFIG.kkm;
  return {
    score,
    maxScore,
    mcqScore,
    essayScore,
    status: passed ? "LULUS" : "TIDAK_LULUS",
    passed,
    details,
  };
}
