"use client";

import NextError from "next/error";

/* For requests the locale middleware doesn't handle (e.g. a missing file).
   Missing pages render [locale]/not-found.tsx instead. */
export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body>
                <NextError statusCode={404} />
            </body>
        </html>
    );
}
