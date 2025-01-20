import Image from "next/image";
import Link from "next/link";
import Button from "./Button";

const footerLinkStyle = "font-normal text-gray-200";

export default function Footer() {
    return (
        <div className="flex w-screen bg-boh-black p-4 align-middle">
            <Image
                src="/images/logo-dark-narrow.png"
                width={100}
                height={0}
                alt="Bridge of Hearts Logo"
                className="m-5 aspect-square object-contain"
            />
            <div className="flex w-full flex-col items-center justify-between gap-10">
                {/* <div className="flex w-full flex-col items-center justify-center gap-3 md:flex-row md:gap-7"> */}
                <div className="flex w-full flex-wrap items-center justify-center gap-5 md:gap-10">
                    <Link href="/" className={footerLinkStyle}>
                        Home
                    </Link>
                    <Link href="/directory" className={footerLinkStyle}>
                        Directory
                    </Link>
                    <Link href="/about" className={footerLinkStyle}>
                        About
                    </Link>
                    <Link href="/contact" className={footerLinkStyle}>
                        Contact
                    </Link>
                </div>
                <div className="max-w-[900px] px-5 text-center text-[10px] text-white md:px-20">
                    <p>
                        Some images displayed on this website are AI-generated.
                    </p>
                    <p>
                        While we strive to provide accurate and up-to-date
                        information, we cannot guarantee the completeness or
                        accuracy of the data presented. The Bridge of Hearts
                        project is not liable for any incorrect or outdated
                        information. Visitors are encouraged to verify details
                        independently.
                    </p>
                </div>
            </div>
            <div></div>
        </div>
    );
}
