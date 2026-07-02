import { NextResponse, type NextRequest } from "next/server";

/**
 * Cookie-presence gate only. Real session validation happens server-side
 * in getCurrentUser() — middleware cannot query the database on the edge
 * runtime, so this is a UX redirect, not a security boundary.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/tasks") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tasks/:path*", "/login", "/register"],
};
