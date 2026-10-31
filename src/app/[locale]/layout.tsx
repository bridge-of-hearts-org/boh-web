import { Metadata } from "next";
import {
    Encode_Sans,
    Encode_Sans_SC,
    Noto_Sans_Sinhala,
} from "next/font/google";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import "../globals.css";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";
import { routing } from "@/i18n/routing";
import { Locale, localizedPath } from "@/utils/locale";

/* Import and configure the fonts */
const encodeSans = Encode_Sans({ subsets: ["latin"] });
const encodeSansSc = Encode_Sans_SC({ subsets: ["latin"] });

/* Fallback for Sinhala text, which Encode Sans doesn't cover. Not preloaded,
   since the browser only downloads it for pages with Sinhala text. */
const notoSansSinhala = Noto_Sans_Sinhala({
    subsets: ["sinhala"],
    variable: "--font-sinhala",
    preload: false,
});

/* Set the HTML metadata */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: "Bridge of Hearts",
        description: t("description"),
        keywords: t("keywords").split(", "),
        metadataBase: new URL("https://www.bridgeofhearts.lk"),
        openGraph: {
            title: t("ogTitle"),
            description: t("ogDescription"),
            url: `https://www.bridgeofhearts.lk${localizedPath(locale as Locale, "/")}`,
            siteName: "Bridge of Hearts",
            images: [
                {
                    url: "/images/opengraph-cover.png",
                    width: 1200,
                    height: 630,
                    alt: t("ogTitle"),
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: "Bridge of Hearts",
            description: t("twitterDescription"),
            images: ["/images/opengraph-cover.png"],
        },
        verification: {
            google: "33b9UH7TVkrujRctk-PNmohRVd_n8XuKUwa3Y6AAztM",
        },
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    return (
        <html lang={locale} className={notoSansSinhala.variable}>
            <body>
                <NextIntlClientProvider>
                    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-white to-orange-100">
                        <div>
                            <MenuBar></MenuBar>
                        </div>
                        <div className="container my-28 flex-auto px-4 md:px-10">
                            {children}
                        </div>
                        <div>
                            <Footer></Footer>
                        </div>
                    </div>
                </NextIntlClientProvider>
                <Analytics />
            </body>
        </html>
    );
}
