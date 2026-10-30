"use client";

import { useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";

import { Menu } from "lucide-react";
import Button from "./Button";
import LanguageToggle from "./LanguageToggle";
import { useRouter } from "@/i18n/navigation";
import { adminMenuItem, getMobileMenuItems } from "@/utils/navigation";

type HamburgerMenuProps = {
    inAdminSession?: boolean;
};

export default function HamburgerMenu({
    inAdminSession = false,
}: HamburgerMenuProps) {
    const router = useRouter();
    const nextRouter = useNextRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    const menuItemStyle =
        "w-full px-5 py-3 text-center font-semibold text-white hover:bg-gray-700 cursor-pointer";

    const handleMenuItemClick = (href: string) => {
        setMenuVisible(false);

        /* Admin pages are English-only, so that link has no locale prefix */
        if (href === adminMenuItem.href) {
            nextRouter.push(href);
        } else {
            router.push(href);
        }
    };

    return (
        <>
            <div>
                <Button
                    name="Menu"
                    className="aspect-square hover:bg-gray-900"
                    variant="secondary"
                    color="transparent"
                    onClick={() => {
                        setMenuVisible(!menuVisible);
                    }}
                >
                    <Menu />
                </Button>
            </div>
            {menuVisible && (
                <>
                    <div
                        className="fixed inset-0 z-50 min-h-screen w-screen bg-black/50"
                        onClick={() => setMenuVisible(false)}
                    ></div>
                    <div
                        data-testid="hamburger-menu-items"
                        className="absolute right-2 top-16 z-50 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-gray-900 bg-opacity-80 px-7 text-white shadow-lg"
                    >
                        {getMobileMenuItems(inAdminSession).map((item) => (
                            <div
                                key={item.href}
                                className={menuItemStyle}
                                onClick={() => handleMenuItemClick(item.href)}
                            >
                                {item.label}
                            </div>
                        ))}
                        <LanguageToggle
                            separatorClassName="block h-px w-full bg-white/30"
                            className={`block ${menuItemStyle}`}
                            onClick={() => setMenuVisible(false)}
                        />
                    </div>
                </>
            )}
        </>
    );
}
