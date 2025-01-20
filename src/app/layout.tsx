import { Metadata } from "next";
import { Encode_Sans, Encode_Sans_SC } from "next/font/google";
import "./globals.css";
import MenuBar from "@/components/MenuBar";
import Footer from "@/components/Footer";

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
            </body>
        </html>
    );
}
