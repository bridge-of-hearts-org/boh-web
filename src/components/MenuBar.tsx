import NextLink from "next/link";
import Button from "./Button";
import HamburgerMenu from "./HamburgerMenu";
import ImageComponent from "./ImageComponent";
import LanguageToggle from "./LanguageToggle";

import MenuLogo from "../../public/images/logo-dark-middle.png";
import { Link } from "@/i18n/navigation";
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

            {/* Below lg the hamburger menu carries this link instead. Admin
                pages are English-only, so this link has no locale prefix. */}
            {inAdminSession && (
                <NextLink
                    href={adminMenuItem.href}
                    className="hidden flex-grow justify-end px-10 lg:flex"
                >
                    <Button
                        name={adminMenuItem.label}
                        variant="secondary"
                        color="red"
                    >
                        {adminMenuItem.label}
                    </Button>
                </NextLink>
            )}

            <nav className="mr-4 hidden gap-3 text-white lg:flex">
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
                <LanguageToggle className="flex items-center rounded-full border border-white/60 px-4 py-2 font-semibold text-white transition-all duration-100 hover:bg-white/10" />
            </nav>
            <div className="lg:hidden">
                <HamburgerMenu inAdminSession={inAdminSession} />
            </div>
        </div>
    );
}
