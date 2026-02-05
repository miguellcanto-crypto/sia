import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const { pathname } = req.nextUrl;

    // Guest-only routes (users should be redirected IF authenticated)
    const isGuestOnlyRoute = pathname === "/auth/login" ||
        pathname === "/auth/forgot-password" ||
        pathname === "/auth/reset-password";

    // Protected routes (users should be redirected IF NOT authenticated)
    const isProtectedRoute = pathname.startsWith("/pos") ||
        pathname.startsWith("/api/products") ||
        pathname.startsWith("/api/sales");

    // Redirect authenticated users away from login
    if (token && isGuestOnlyRoute) {
        return NextResponse.redirect(new URL("/pos", req.url));
    }

    // Redirect unauthenticated users to login
    if (!token && isProtectedRoute) {
        const url = new URL("/auth/login", req.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/pos/:path*",
        "/auth/:path*",
        "/api/products/:path*",
        "/api/sales/:path*",
    ],
};
