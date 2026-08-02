import { NextResponse } from "next/server";

// Fitur "Cek Nama" dihapus. Route ini tidak lagi dipakai.
export async function GET() {
  return NextResponse.json({ ok: false, message: "Fitur tidak tersedia." }, { status: 404 });
}
