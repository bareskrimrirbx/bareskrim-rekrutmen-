import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/constants";

const COOKIE_NAME = "brk_token";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token && getJwtSecret().length >= 32) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      if (typeof payload.userId === "string") {
        return NextResponse.next();
      }
    } catch {
      // token invalid -> redirect login
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/ujian", "/hasil", "/admin"],
};
