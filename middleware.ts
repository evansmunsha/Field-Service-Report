// middleware.ts

import { auth } from "./auth"

export default auth

export const config = {
  matcher: [
    // protect all routes except API, _next/static, _next/image, favicon.ico
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
