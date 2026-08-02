import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, BlacklistCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminKey } from "@/lib/constants";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-key") === getAdminKey();
}

const BulkSchema = z.object({
  category: z.enum(["POLRI", "PENDIDIKAN"]),
  usernames: z.array(z.string().trim().min(1).max(40)).min(1).max(500),
});

// Import massal: tempel banyak username sekaligus.
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Data import tidak valid." }, { status: 400 });
  }

  try {
    const data = parsed.data.usernames.map((username) => ({
      category: parsed.data.category as BlacklistCategory,
      username,
    }));
    const result = await prisma.blacklistEntry.createMany({ data });
    return NextResponse.json({
      ok: true,
      message: `${result.count} entri blacklist berhasil ditambahkan.`,
      count: result.count,
    });
  } catch (e) {
    if (isTableMissing(e)) {
      return NextResponse.json(
        { ok: false, message: "Database belum diinisialisasi. Klik tombol Initialize Database dulu." },
        { status: 409 }
      );
    }
    throw e;
  }
}

function isTableMissing(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}
