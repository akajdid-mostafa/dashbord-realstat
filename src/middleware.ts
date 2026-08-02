import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";

function extractToken(req: NextRequest): string | null {
  const authorization = req.headers.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }
  const cookie = req.cookies.get("token");
  return cookie?.value ?? null;
}

function isPublicApiRequest(req: NextRequest): boolean {
  const method = req.method;
  if (method === "GET" || method === "OPTIONS") return true;
  if (method === "POST" && req.nextUrl.pathname === "/api/login") return true;
  return false;
}

function withCors(response: NextResponse, origin: string | null | undefined) {
  const cors = corsHeaders(origin);
  Object.entries(cors).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // ---- API routes: CORS + mutation protection ----
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    if (isPublicApiRequest(req)) {
      return withCors(NextResponse.next(), origin);
    }

    const token = extractToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    try {
      await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) },
      );
    }

    return withCors(NextResponse.next(), origin);
  }

  // ---- Dashboard page protection ----
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      await verifyToken(token);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
