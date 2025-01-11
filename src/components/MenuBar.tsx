import Link from "next/link";
import Button from "./Button";

export default function MenuBar() {
    return (
        <div
            id="header"
            className="flex w-screen items-center justify-between bg-boh-black p-4 shadow-lg shadow-gray-400"
        >
            <div className="flex-shrink-0">
                <img
                    className="w-[220px]"
                    src="/images/logo-dark-middle.png"
                    alt="Bridge of Hearts Logo"
                />
            </div>
            <div className="mr-4 flex gap-3 text-white">
                <Link href="/">
                    <Button variant="secondary" color="transparent">
                        Home
                    </Button>
                </Link>
                <Link href="/directory">
                    <Button variant="secondary" color="transparent">
                        Directory
                    </Button>
                </Link>
                <Link href="/about">
                    <Button variant="secondary" color="transparent">
                        About
                    </Button>
                </Link>
                <Link href="/contact">
                    <Button variant="secondary" color="transparent">
                        Contact
                    </Button>
                </Link>
            </div>
        </div>
    );
}
