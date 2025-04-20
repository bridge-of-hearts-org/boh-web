"use client";

import { MouseEventHandler, ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader } from "lucide-react";

type NavigationLinkProps = {
    href: string;
    children: ReactNode;
    className?: string;
};

export default function ClientLink({
    href,
    children,
    className = "",
}: NavigationLinkProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showLoader, setShowLoader] = useState(false);

    const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.preventDefault();
        setShowLoader(true);

        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className={`relative inline-block ${className}`}
        >
            {children}
            {showLoader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-20">
                    <div className="flex h-12 w-12 animate-spin items-center justify-center">
                        <Loader />
                    </div>
                </div>
            )}
        </a>
    );
}
