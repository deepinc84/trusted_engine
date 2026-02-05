import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/quotes/step1") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/quotes";
    url.searchParams.set("step", "1");
    return NextResponse.rewrite(url);
  }

  if (pathname === "/api/quotes/step2") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/quotes";
    url.searchParams.set("step", "2");
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/quotes/:path*"]
};
