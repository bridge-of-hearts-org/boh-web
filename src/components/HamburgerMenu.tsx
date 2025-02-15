"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Menu } from "lucide-react";
import Button from "./Button";

export default function HamburgerMenu() {
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);

    const menuItemStyle =
        "w-full px-5 py-3 text-center font-semibold text-white hover:bg-gray-700 cursor-pointer";

    const handleMenuItemClick = (page: string) => {
        setMenuVisible(false);
        router.push(`/${page}`);
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
                    <div className="absolute right-2 top-16 z-50 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-gray-900 bg-opacity-80 px-7 text-white shadow-lg">
                        <div
                            className={menuItemStyle}
                            onClick={() => handleMenuItemClick("")}
                        >
                            Home
                        </div>
                        <div
                            className={menuItemStyle}
                            onClick={() => handleMenuItemClick("directory")}
                        >
                            Directory
                        </div>
                        <div
                            className={menuItemStyle}
                            onClick={() => handleMenuItemClick("about")}
                        >
                            About
                        </div>
                        <div
                            className={menuItemStyle}
                            onClick={() => handleMenuItemClick("contact")}
                        >
                            Contact
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
