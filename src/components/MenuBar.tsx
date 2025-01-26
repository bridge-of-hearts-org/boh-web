import Link from "next/link";
import Button from "./Button";
import HamburgerMenu from "./HamburgerMenu";
import ImageComponent from "./ImageComponent";

export default function MenuBar() {
    return (
        <div
            id="header"
            className="absolute left-0 top-0 flex w-screen items-center justify-between bg-boh-black p-4 shadow-lg shadow-gray-400"
        >
            <div className="flex-shrink-0 pl-5">
                <Link href="/">
                    <ImageComponent
                        imageSrc="/images/logo-dark-middle.png"
                        containerClasses="w-[220px] h-[50px] bg-transparent rounded-none"
                        imageClasses="object-contain"
                        imageSizes="220px"
                        alt="Bridge of Hearts Logo"
                    />
                </Link>
            </div>
            <div className="mr-4 hidden gap-3 text-white md:flex">
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
            <div className="md:hidden">
                <HamburgerMenu />
            </div>
        </div>
    );
}
