import { NextResponse } from "next/server";

// Fitur notifikasi pusdik dihapus. Route ini tidak lagi dipakai.
export async function POST() {
  return NextResponse.json({ ok: false, message: "Fitur tidak tersedia." }, { status: 404 });
}
