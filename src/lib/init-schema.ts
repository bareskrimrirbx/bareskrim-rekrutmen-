// ============================================================
// Inisialisasi Schema Database (tanpa CLI, tanpa migrasi manual)
// Idempoten: aman dijalankan berulang kali.
// Dipakai oleh /api/admin/init agar admin cukup klik dari browser.
// ============================================================

import { prisma } from "@/lib/prisma";

const statements: string[] = [
  // Enum (ada pengecekan agar idempoten)
  `DO $$ BEGIN
     IF to_regtype('"QuestionType"') IS NULL THEN
       CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'ESSAY');
     END IF;
   END $$;`,
  `DO $$ BEGIN
     IF to_regtype('"AttemptStatus"') IS NULL THEN
       CREATE TYPE "AttemptStatus" AS ENUM ('LULUS', 'TIDAK_LULUS');
     END IF;
   END $$;`,

  // ===== User (Casis) =====
  `CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT NOT NULL,
     "robloxId" INTEGER NOT NULL,
     "username" TEXT NOT NULL,
     "displayName" TEXT NOT NULL,
     "avatarUrl" TEXT,
     "profileUrl" TEXT,
     "requiredGroupId" INTEGER,
     "policeGroupRankId" INTEGER,
     "policeGroupRank" TEXT,
     "bannedGroupIds" JSONB,
     "matraBlocked" BOOLEAN NOT NULL DEFAULT false,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "User_pkey" PRIMARY KEY ("id")
   );`,

  // ===== Periode Rekrutmen =====
  `CREATE TABLE IF NOT EXISTS "ExamPeriod" (
     "id" TEXT NOT NULL,
     "name" TEXT NOT NULL,
     "description" TEXT,
     "isActive" BOOLEAN NOT NULL DEFAULT false,
     "seed" INTEGER NOT NULL,
     "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "closedAt" TIMESTAMP(3),
     CONSTRAINT "ExamPeriod_pkey" PRIMARY KEY ("id")
   );`,

  // ===== Bank Soal =====
  `CREATE TABLE IF NOT EXISTS "Question" (
     "id" TEXT NOT NULL,
     "type" "QuestionType" NOT NULL,
     "prompt" TEXT NOT NULL,
     "options" JSONB,
     "correctKey" TEXT,
     "points" INTEGER NOT NULL,
     "keywords" JSONB,
     "isActive" BOOLEAN NOT NULL DEFAULT true,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
   );`,

  // ===== Percobaan Ujian =====
  `CREATE TABLE IF NOT EXISTS "ExamAttempt" (
     "id" TEXT NOT NULL,
     "periodId" TEXT NOT NULL,
     "userId" TEXT NOT NULL,
     "attemptKey" TEXT NOT NULL,
     "questionsJson" JSONB NOT NULL,
     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "submittedAt" TIMESTAMP(3),
     CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id"),
     CONSTRAINT "ExamAttempt_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ExamPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE,
     CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
   );`,

  // ===== Jawaban per Soal =====
  `CREATE TABLE IF NOT EXISTS "ExamAnswer" (
     "id" TEXT NOT NULL,
     "attemptId" TEXT NOT NULL,
     "questionId" TEXT NOT NULL,
     "answer" TEXT NOT NULL,
     "isCorrect" BOOLEAN,
     "earnedPoints" INTEGER,
     CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id"),
     CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
     CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE
   );`,

  // ===== Hasil Ujian =====
  `CREATE TABLE IF NOT EXISTS "ExamResult" (
     "id" TEXT NOT NULL,
     "attemptId" TEXT NOT NULL,
     "score" INTEGER NOT NULL,
     "maxScore" INTEGER NOT NULL,
     "mcqScore" INTEGER NOT NULL,
     "essayScore" INTEGER NOT NULL,
     "status" "AttemptStatus" NOT NULL,
     "passed" BOOLEAN NOT NULL,
     "answersJson" JSONB NOT NULL,
     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id"),
     CONSTRAINT "ExamResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE
   );`,

  // ===== Index Unik =====
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_robloxId_key" ON "User"("robloxId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamPeriod_seed_key" ON "ExamPeriod"("seed");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttempt_attemptKey_key" ON "ExamAttempt"("attemptKey");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttempt_periodId_userId_key" ON "ExamAttempt"("periodId", "userId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ExamResult_attemptId_key" ON "ExamResult"("attemptId");`,

  // ===== Index Pendukung =====
  `CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");`,
  `CREATE INDEX IF NOT EXISTS "ExamAttempt_userId_idx" ON "ExamAttempt"("userId");`,
  `CREATE INDEX IF NOT EXISTS "ExamResult_submittedAt_idx" ON "ExamResult"("submittedAt");`,
  `CREATE INDEX IF NOT EXISTS "ExamPeriod_isActive_idx" ON "ExamPeriod"("isActive");`,
  `CREATE INDEX IF NOT EXISTS "Question_type_isActive_idx" ON "Question"("type", "isActive");`,
];

export async function schemaExists(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'ExamResult'
       ) AS ok`
    );
    return (rows as Array<{ ok: boolean }>)[0]?.ok === true;
  } catch {
    return false;
  }
}

export async function initSchema(): Promise<void> {
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
}
