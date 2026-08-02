import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { randomSeed } from "@/lib/utils";
import { getAdminKey } from "@/lib/constants";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-key") === getAdminKey();
}

const OpenPeriodSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional().default(""),
});

// Buka periode rekrutmen baru: periode lama ditutup otomatis,
// seed baru dihasilkan -> bank soal ter-reset & teracak ulang.
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = OpenPeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Nama periode tidak valid." }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.examPeriod.updateMany({ where: { isActive: true }, data: { isActive: false, closedAt: new Date() } }),
      prisma.examPeriod.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          isActive: true,
          seed: randomSeed(),
        },
      }),
    ]);
  } catch (e) {
    if (isTableMissing(e)) {
      return NextResponse.json(
        { ok: false, message: "Database belum diinisialisasi. Klik tombol Initialize Database dulu." },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true, message: "Periode baru berhasil dibuka." });
}

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const periods = await prisma.examPeriod.findMany({
      orderBy: { openedAt: "desc" },
      include: { _count: { select: { attempts: true } } },
    });
    return NextResponse.json({ ok: true, periods });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
      return NextResponse.json({ ok: true, periods: [] });
    }
    throw e;
  }
}

function isTableMissing(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}
