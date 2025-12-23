import { auth } from "./auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage = nextUrl.pathname.startsWith("/signin") || nextUrl.pathname.startsWith("/signup")
  const isPublicRoute = isAuthPage

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/signin", nextUrl))
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}



/* //middleware.ts

import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authjs.session-token")?.value

  // If no session and trying to access protected route, redirect to signin
  if (!token && !request.nextUrl.pathname.startsWith("/signin") && !request.nextUrl.pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/sigin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
 */