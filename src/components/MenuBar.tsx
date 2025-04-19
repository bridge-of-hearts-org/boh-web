import Link from "next/link";
import Button from "./Button";
import HamburgerMenu from "./HamburgerMenu";
import ImageComponent from "./ImageComponent";

import MenuLogo from "../../public/images/logo-dark-middle.png";
import { getServerAuth } from "@/lib/auth";

export default async function MenuBar() {
    const session = await getServerAuth();
    const inAdminSession = session ? true : false;

    return (
        <div
            id="header"
            className="absolute left-0 top-0 flex w-screen items-center justify-between bg-boh-black p-4 shadow-lg shadow-gray-400"
        >
            <div className="flex-shrink-0 pl-5">
                <Link href="/">
                    <ImageComponent
                        src={MenuLogo}
                        sizes="220px"
                        width={220}
                        height={50}
                        placeholder="blur"
                        loading="eager"
                        alt="Bridge of Hearts Logo"
                        className="h-[50px] w-[220px] rounded-none object-contain"
                    />
                </Link>
            </div>

            {inAdminSession && (
                <Link
                    href="/admin"
                    className="flex flex-grow justify-end px-10"
                >
                    <Button name="Home" variant="secondary" color="red">
                        Admin Session
                    </Button>
                </Link>
            )}

            <nav className="mr-4 hidden gap-3 text-white md:flex">
                <Link href="/">
                    <Button name="Home" variant="secondary" color="transparent">
                        Home
                    </Button>
                </Link>
                <Link href="/directory">
                    <Button
                        name="Directory"
                        variant="secondary"
                        color="transparent"
                    >
                        Directory
                    </Button>
                </Link>
                <Link href="/about">
                    <Button
                        name="About"
                        variant="secondary"
                        color="transparent"
                    >
                        About
                    </Button>
                </Link>
                <Link href="/contact">
                    <Button
                        name="Contact"
                        variant="secondary"
                        color="transparent"
                    >
                        Contact
                    </Button>
                </Link>
            </nav>
            <div className="md:hidden">
                <HamburgerMenu />
            </div>
        </div>
    );
}
