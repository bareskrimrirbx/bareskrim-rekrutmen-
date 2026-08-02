import type { AttemptStatus } from "@prisma/client";
import type { ClientQuestion } from "@/lib/grading";

export type { ClientQuestion };

export interface VerifyResponse {
  success: boolean;
  code?:
    | "USER_NOT_FOUND"
    | "NOT_IN_REQUIRED_GROUP"
    | "MATRA_BLOCKED"
    | "INTERNAL";
  message?: string;
  user?: {
    robloxId: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    policeGroupRank: string | null;
  };
}

export interface SessionApiResponse {
  ok: boolean;
  code?: "NO_ACTIVE_PERIOD" | "ALREADY_SUBMITTED" | "UNAUTHORIZED";
  message?: string;
  attemptId?: string;
  questions?: ClientQuestion[];
  period?: { name: string; description: string | null };
}

export interface SubmitApiResponse {
  ok: boolean;
  code?: "NOT_FOUND" | "ALREADY_SUBMITTED" | "EXPIRED" | "INVALID" | "UNAUTHORIZED";
  message?: string;
  resultId?: string;
}

export interface ResultDetail {
  questionId: string;
  type: "MCQ" | "ESSAY";
  prompt: string;
  points: number;
  userAnswer: string;
  isCorrect: boolean | null;
  earned: number;
  options?: Array<{ key: string; text: string }>;
  correctKey?: string;
  matchedKeywords?: string[];
}

export interface ResultPayload {
  id: string;
  score: number;
  maxScore: number;
  mcqScore: number;
  essayScore: number;
  status: AttemptStatus;
  passed: boolean;
  submittedAt: string;
  answersJson: ResultDetail[];
  attempt: {
    id: string;
    user: {
      username: string;
      displayName: string;
      robloxId: number;
      avatarUrl: string | null;
      policeGroupRank: string | null;
    };
    period: { name: string };
  };
}
