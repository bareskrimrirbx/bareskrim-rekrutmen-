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
      return NextResponse.json(
        {
          success: false,
          code: "NOT_IN_REQUIRED_GROUP",
          message: `Anda belum terdaftar di grup wajib "${CONFIG.requiredGroupName}".`,
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
    return NextResponse.json(
      { success: false, code: "INTERNAL", message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
