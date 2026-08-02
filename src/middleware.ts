import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "brk_token";
const PROTECTED = ["/ujian", "/hasil", "/admin"];

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token && process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
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
  matcher: PROTECTED,
};
