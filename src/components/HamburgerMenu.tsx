"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Menu } from "lucide-react";
import Button from "./Button";
import { getMobileMenuItems } from "@/utils/navigation";

type HamburgerMenuProps = {
    inAdminSession?: boolean;
};

export default function HamburgerMenu({
    inAdminSession = false,
}: HamburgerMenuProps) {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    const menuItemStyle =
        "w-full px-5 py-3 text-center font-semibold text-white hover:bg-gray-700 cursor-pointer";

    const handleMenuItemClick = (href: string) => {
        setMenuVisible(false);
        router.push(href);
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
                    </div>
                </>
            )}
        </>
    );
}
