import Link from "next/link";
import Button from "./Button";
import HamburgerMenu from "./HamburgerMenu";
import ImageComponent from "./ImageComponent";

import MenuLogo from "../../public/images/logo-dark-middle.png";
import { getServerAuth } from "@/lib/auth";
import { adminMenuItem, mainMenuItems } from "@/utils/navigation";

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

            {/* Below md the hamburger menu carries this link instead */}
            {inAdminSession && (
                <Link
                    href={adminMenuItem.href}
                    className="hidden flex-grow justify-end px-2 md:flex lg:px-10"
                >
                    <Button
                        name={adminMenuItem.label}
                        variant="secondary"
                        color="red"
                    >
                        {adminMenuItem.label}
                    </Button>
                </Link>
            )}

            <nav className="mr-4 hidden gap-3 text-white md:flex">
                {mainMenuItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            name={item.label}
                            variant="secondary"
                            color="transparent"
                        >
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>
            <div className="md:hidden">
                <HamburgerMenu inAdminSession={inAdminSession} />
            </div>
        </div>
    );
}
