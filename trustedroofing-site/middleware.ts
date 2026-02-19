import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const headerToken = request.headers.get("x-admin-token");
  const cookieToken = request.cookies.get("admin_token")?.value;
  const queryToken = searchParams.get("token");

  const providedToken = headerToken ?? cookieToken ?? queryToken;

  if (providedToken !== adminToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();

  if (queryToken === adminToken && cookieToken !== adminToken) {
    response.cookies.set("admin_token", adminToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/"
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
