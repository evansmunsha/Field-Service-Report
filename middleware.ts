import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authjs.session-token")?.value

  // If no session and trying to access protected route, redirect to signin
  if (!token && !request.nextUrl.pathname.startsWith("/signin") && !request.nextUrl.pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
