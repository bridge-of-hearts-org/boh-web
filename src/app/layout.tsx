import { Metadata } from "next";
import { Encode_Sans, Encode_Sans_SC } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";

/* Import and configure the fonts */
const encodeSans = Encode_Sans({ subsets: ["latin"] });
const encodeSansSc = Encode_Sans_SC({ subsets: ["latin"] });

/* Set the HTML metadata */
export const metadata: Metadata = {
    title: "Bridge of Hearts",
    description:
        "Find and support Child Development Centres (Children's Homes) in Sri Lanka. " +
        "Our directory provides up-to-date contact details, locations, and resident information. " +
        "Filter by name, city, district, and province. Continuously updated to ensure accurate data.",
    keywords: [
        "childcare facilities Sri Lanka",
        "children's homes Sri Lanka",
        "child development centres Sri Lanka",
        "orphanages Sri Lanka ",
    ],
    metadataBase: new URL("https://www.bridgeofhearts.lk"),
    openGraph: {
        title: "Bridge of Hearts - A Directory of Child Development Centres in Sri Lanka",
        description:
            "Find and support Child Development Centres (Children's Homes) across Sri Lanka.",
        url: "https://www.bridgeofhearts.lk",
        siteName: "Bridge of Hearts",
        images: [
            {
                url: "/images/opengraph-cover.png",
                width: 1200,
                height: 630,
                alt: "Bridge of Hearts - A Directory of Child Development Centres in Sri Lanka",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Bridge of Hearts",
        description:
            "Discover childcare facilities in Sri Lanka and help those in need.",
        images: ["/images/opengraph-cover.png"],
    },
    verification: {
        google: "33b9UH7TVkrujRctk-PNmohRVd_n8XuKUwa3Y6AAztM",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
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
                <Analytics />
            </body>
        </html>
    );
}
