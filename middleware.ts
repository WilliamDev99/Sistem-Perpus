import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Check for NextAuth session token cookies (support both HTTP and HTTPS secure cookie names)
  const token = 
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  const isLoggedIn = !!token;

  const isOnDashboard = 
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/books") ||
    nextUrl.pathname.startsWith("/borrows") ||
    nextUrl.pathname.startsWith("/users") ||
    nextUrl.pathname.startsWith("/fines") ||
    nextUrl.pathname.startsWith("/my-borrows") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/categories");

  const isOnAuth = 
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next();
    // Redirect to login if not logged in
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isOnAuth && isLoggedIn) {
    // Redirect to dashboard if already logged in and trying to access auth pages
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
