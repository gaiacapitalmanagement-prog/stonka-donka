import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  const session = await auth()

  // Allow public pages and auth API routes
  if (
    request.nextUrl.pathname === "/welcome" ||
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to welcome page
  if (!session?.user) {
    return NextResponse.redirect(new URL("/welcome", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
