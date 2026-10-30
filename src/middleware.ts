import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { adminRedirectPath } from "./utils/locale";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    /* Admin pages are English-only, so send /si/admin etc. to /admin */
    const adminPath = adminRedirectPath(request.nextUrl.pathname);

    if (adminPath) {
        const url = request.nextUrl.clone();
        url.pathname = adminPath;
        return NextResponse.redirect(url);
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: [
        /* Everything except API routes, Next.js and Vercel internals, and
           files with an extension (sitemap.xml, robots.txt, images, ...) */
        "/((?!api|_next|_vercel|.*\\..*).*)",
        /* Facility slugs may contain dots, which the pattern above skips */
        "/facility/:path*",
        "/si/facility/:path*",
    ],
};
