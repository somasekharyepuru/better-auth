import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require the user to be logged OUT (public routes that should redirect to dashboard if logged in)
const publicOnlyRoutes = ["/", "/login", "/signup"];

// Routes that require the user to be logged IN
const protectedRoutes = ["/dashboard", "/profile", "/settings", "/organizations", "/tools"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for session cookie - better-auth uses this cookie name
    const sessionCookie = request.cookies.get("better-auth.session_token");
    const isAuthenticated = !!sessionCookie;

    // If user is authenticated and trying to access public-only routes (landing, login, signup)
    // Redirect them to dashboard
    if (isAuthenticated && publicOnlyRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is NOT authenticated and trying to access protected routes
    // Redirect them to login
    if (!isAuthenticated) {
        const isProtectedRoute = protectedRoutes.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (isProtectedRoute) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
};
