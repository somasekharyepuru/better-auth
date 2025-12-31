import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that should redirect to dashboard if user is logged in
const publicOnlyRoutes = ["/", "/login", "/signup"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only handle public-only routes (landing, login, signup)
    // For these routes, redirect to dashboard if user appears to be authenticated
    if (publicOnlyRoutes.includes(pathname)) {
        // Check for session cookie - better-auth uses this cookie name
        // Also check common variations
        const sessionCookie =
            request.cookies.get("better-auth.session_token") ||
            request.cookies.get("better-auth.session") ||
            request.cookies.get("__session");

        if (sessionCookie) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // Let all other routes pass through - protected routes handle their own auth
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Only match the specific public routes we care about
        "/",
        "/login",
        "/signup",
    ],
};
