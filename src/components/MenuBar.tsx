import Link from "next/link";
import Button from "./Button";
import HamburgerMenu from "./HamburgerMenu";
import ImageComponent from "./ImageComponent";

import MenuLogo from "../../public/images/logo-dark-middle.png";

export default function MenuBar() {
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
                        placeholder="blur"
                        alt="Bridge of Hearts Logo"
                        className="h-[50px] w-[220px] rounded-none object-contain"
                    />
                </Link>
            </div>
            <div className="mr-4 hidden gap-3 text-white md:flex">
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
            </div>
            <div className="md:hidden">
                <HamburgerMenu />
            </div>
        </div>
    );
}
