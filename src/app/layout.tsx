import { Metadata } from "next";
import { Encode_Sans, Encode_Sans_SC } from "next/font/google";
import "./globals.css";
import MenuBar from "@/components/MenuBar";

/* Import and configure the fonts */
const encodeSans = Encode_Sans({ subsets: ["latin"] });
const encodeSansSc = Encode_Sans_SC({ subsets: ["latin"] });

/* Set the HTML metadata */
export const metadata: Metadata = {
    title: "Bridge of Hearts",
    description: "An online directory for childcare facilities in Sri Lanka",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <div>
                    <MenuBar></MenuBar>
                </div>
                <div className="container justify-self-center">{children}</div>
            </body>
        </html>
    );
}
