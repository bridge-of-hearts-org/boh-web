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
                className="m-5"
            />
            <div className="flex w-full flex-col items-center justify-between gap-10">
                <div className="flex w-full items-center justify-center">
                    <Link href="/">
                        <Button
                            className={footerLinkStyle}
                            variant="secondary"
                            color="transparent"
                        >
                            Home
                        </Button>
                    </Link>
                    <Link href="/directory">
                        <Button
                            className={footerLinkStyle}
                            variant="secondary"
                            color="transparent"
                        >
                            Directory
                        </Button>
                    </Link>
                    <Link href="/about">
                        <Button
                            className={footerLinkStyle}
                            variant="secondary"
                            color="transparent"
                        >
                            About
                        </Button>
                    </Link>
                    <Link href="/contact">
                        <Button
                            className={footerLinkStyle}
                            variant="secondary"
                            color="transparent"
                        >
                            Contact
                        </Button>
                    </Link>
                </div>
                <div className="max-w-[900px] px-20 text-center text-[10px] text-white">
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
