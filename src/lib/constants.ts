export const CONFIG = {
  kkm: Number(process.env.KKM ?? 75),
  mcqCount: Number(process.env.MCQ_COUNT ?? 15),
  essayCount: Number(process.env.ESSAY_COUNT ?? 5),
  mcqPoints: Number(process.env.MCQ_POINTS ?? 4),
  essayPoints: Number(process.env.ESSAY_POINTS ?? 8),
  examDurationMinutes: Number(process.env.EXAM_DURATION_MINUTES ?? 30),
  requiredGroupId: Number(process.env.REQUIRED_GROUP_ID ?? 11902409),
  requiredGroupName: process.env.REQUIRED_GROUP_NAME ?? "[RI] Republic Indonesia",
  policeGroupId: Number(process.env.POLICE_GROUP_ID ?? 17166238),
  policeGroupName: process.env.POLICE_GROUP_NAME ?? "Kepolisian",
  bannedGroupIds: (process.env.BANNED_GROUP_IDS ?? "367050757,34766643")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0),
  bannedGroupNames: (process.env.BANNED_GROUP_NAMES ?? "TNI AD,TNI AL")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;

export const REDIRECT_BLOCKED_MESSAGE =
  "Mohon maaf, Anda tidak dapat mengakses soal ujian rekrutmen Bareskrim Polri karena terdaftar sebagai anggota matra lain (AD/AL).";

export const JWT_SECRET_FALLBACK =
  "RahasiaBareskrimRecruitment2026-9f8a7s6d5f4g3h2j1k0l";

export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? JWT_SECRET_FALLBACK;
}

export const ADMIN_KEY_FALLBACK = "AdminBareskrim2026";

export function getAdminKey(): string {
  return process.env.ADMIN_KEY ?? ADMIN_KEY_FALLBACK;
}
