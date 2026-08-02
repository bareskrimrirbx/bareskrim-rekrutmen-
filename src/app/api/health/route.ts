import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "bareskrim-rekrutmen", time: new Date().toISOString() });
}
