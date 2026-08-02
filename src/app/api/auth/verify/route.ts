import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CONFIG } from "@/lib/constants";
import {
  resolveUserByUsername,
  getUserGroups,
  getAvatarHeadshot,
  profileUrl,
  type RobloxGroupRole,
} from "@/lib/roblox";
import { createSessionCookie } from "@/lib/auth";
import { ensureSchema } from "@/lib/init-schema";

const VerifySchema = z.object({
  username: z.string().trim().min(2).max(40),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "USER_NOT_FOUND", message: "Username tidak valid." },
      { status: 400 }
    );
  }

  const username = parsed.data.username;

  try {
    // 1) Resolve username -> Roblox ID + info
    const userInfo = await resolveUserByUsername(username);
    if (!userInfo) {
      return NextResponse.json(
        { success: false, code: "USER_NOT_FOUND", message: "User Roblox tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2) Ambil keanggotaan grup + avatar
    const [groups, avatarUrl] = await Promise.all([
      getUserGroups(userInfo.id),
      getAvatarHeadshot(userInfo.id),
    ]);

    const isIn = (gid: number) => groups.some((g) => g.groupId === gid);

    // 3) Cek grup wajib [RI] Republic Indonesia
    if (!isIn(CONFIG.requiredGroupId)) {
      const detected = groups
        .slice(0, 30)
        .map((g) => `${g.groupName} (${g.groupId})`)
        .join(", ");
      return NextResponse.json(
        {
          success: false,
          code: "NOT_IN_REQUIRED_GROUP",
          message:
            `Anda belum terdaftar di grup wajib "${CONFIG.requiredGroupName}" (ID: ${CONFIG.requiredGroupId}). ` +
            `Total ${groups.length} grup terdeteksi oleh Roblox: ${detected || "tidak ada / kosong"}. ` +
            `Jika grup Anda ada di daftar itu, periksa REQUIRED_GROUP_ID di Netlify.`,
        },
        { status: 403 }
      );
    }

    // 4) Cross-Group / Matra Check: tolak bila anggota grup matra lain (AD/AL)
    const bannedFound = CONFIG.bannedGroupIds.filter(isIn);
    if (bannedFound.length > 0) {
      const bannedNames = CONFIG.bannedGroupNames.length
        ? CONFIG.bannedGroupNames.join(", ")
        : "matra lain (AD/AL)";
      return NextResponse.json(
        {
          success: false,
          code: "MATRA_BLOCKED",
          message: `Mohon maaf, Anda tidak dapat mengakses soal ujian rekrutmen Bareskrim Polri karena terdaftar sebagai anggota matra lain (${bannedNames}).`,
        },
        { status: 403 }
      );
    }

    // 5) Pangkat di grup Kepolisian
    const policeRole: RobloxGroupRole | undefined = groups.find(
      (g) => g.groupId === CONFIG.policeGroupId
    );

    // 6) Upsert user + simpan snapshot keanggotaan
    await ensureSchema();
    const user = await prisma.user.upsert({
      where: { robloxId: userInfo.id },
      update: {
        displayName: userInfo.displayName,
        avatarUrl,
        profileUrl: profileUrl(userInfo.id),
        policeGroupRankId: policeRole?.roleId ?? null,
        policeGroupRank: policeRole?.roleName ?? null,
        requiredGroupId: CONFIG.requiredGroupId,
        bannedGroupIds: bannedFound,
        matraBlocked: bannedFound.length > 0,
      },
      create: {
        robloxId: userInfo.id,
        username: userInfo.name,
        displayName: userInfo.displayName,
        avatarUrl,
        profileUrl: profileUrl(userInfo.id),
        policeGroupRankId: policeRole?.roleId ?? null,
        policeGroupRank: policeRole?.roleName ?? null,
        requiredGroupId: CONFIG.requiredGroupId,
        bannedGroupIds: bannedFound,
        matraBlocked: bannedFound.length > 0,
      },
    });

    await createSessionCookie(user.id, user.robloxId);

    return NextResponse.json({
      success: true,
      user: {
        robloxId: user.robloxId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        policeGroupRank: user.policeGroupRank,
      },
    });
  } catch (e) {
    console.error("verify error", e);
    const raw = e instanceof Error ? e.message : String(e);
    const sanitized = sanitizeError(raw);
    let hint = "";
    const m = raw;
    if (m.includes("DATABASE_URL")) {
      hint = " DATABASE_URL belum diisi.";
    } else if (m.includes("P2021")) {
      hint = " Tabel database belum dibuat (auto-init gagal).";
    } else if (m.includes("P1010") || m.includes("28P01") || /password|authentication/i.test(m)) {
      hint = " Password database ditolak oleh Supabase.";
    } else if (
      m.includes("P1001") ||
      m.includes("P1000") ||
      m.includes("P1002") ||
      m.includes("P1017") ||
      m.includes("ECONNREFUSED") ||
      m.includes("ETIMEDOUT") ||
      m.includes("getaddrinfo")
    ) {
      hint = " Tidak bisa terhubung ke database Supabase.";
    } else if (m.includes("P1012")) {
      hint = " Kesalahan konfigurasi database.";
    } else if (m.includes("429") || m.includes("Roblox API error")) {
      hint = " API Roblox sedang membatasi permintaan. Coba lagi nanti.";
    }
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL",
        build: "v5",
        message: `Terjadi kesalahan server. Coba lagi.${hint}`,
        detail: sanitized,
      },
      { status: 500 }
    );
  }
}

function sanitizeError(msg: string): string {
  return msg
    .replace(/postgres(ql)?:\/\/[^@\s]+@/g, "postgresql://***:***@")
    .slice(0, 500);
}
