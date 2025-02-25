import Link from "next/link";
import ImageComponent from "./ImageComponent";

import BohLogo from "../../public/images/logo-dark-narrow.png";
import FacebookLogo from "../../public/images/facebook-icon.svg";

const footerLinkStyle = "font-normal text-gray-200";

export default function Footer() {
    return (
        <div className="flex w-screen bg-boh-black p-4 align-middle">
            <Link href="/">
                <ImageComponent
                    src={BohLogo}
                    placeholder="blur"
                    width={100}
                    height={100}
                    sizes="100px"
                    alt="Bridge of Hearts Logo"
                    className="h-[100px] w-[100px] rounded-none object-contain p-2"
                />
            </Link>
            <div className="flex w-full flex-col items-center justify-between gap-8">
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
                <div className="max-w-[900px] px-5 text-center text-[10px] italic text-white md:px-20">
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
                <div className="text-sm text-white lg:hidden">
                    <a href="mailto:bridgeofheartslk@gmail.com">
                        bridgeofheartslk@gmail.com
                    </a>
                </div>
            </div>
            <div className="my-3 mr-4 flex flex-col items-end justify-between">
                <a
                    href="https://www.facebook.com/profile.php?id=61573039696750"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="boh-link"
                >
                    <ImageComponent
                        src={FacebookLogo}
                        width={40}
                        sizes="40px"
                        alt="Facebook Logo"
                        className="invert"
                    />
                </a>
                <div className="hidden text-sm text-white lg:block">
                    <a href="mailto:bridgeofheartslk@gmail.com">
                        bridgeofheartslk@gmail.com
                    </a>
                </div>
            </div>
        </div>
    );
}
