import { NextResponse } from "next/server";
import { getAdminKey } from "@/lib/constants";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-key") === getAdminKey();
}

// Konfigurasi channel Discord (untuk tombol "Buka Channel" cross-check manual).
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Tidak diizinkan." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    guildId: process.env.DISCORD_GUILD_ID || null,
    putusan: process.env.DISCORD_PUTUSAN_CHANNEL_ID || null,
    polri: process.env.DISCORD_BLACKLIST_POLRI_CHANNEL_ID || null,
    pendidikan: process.env.DISCORD_BLACKLIST_PENDIDIKAN_CHANNEL_ID || null,
  });
}
