"use client";

import Button from "@/components/Button";
import Link from "next/link";

export default function ErrorPage() {
    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-10">
            <h2 className="text-2xl font-semibold">Something went wrong!</h2>
            <Link href="/">
                <Button name="Return Home" variant="secondary" color="black">
                    Return Home
                </Button>
            </Link>
        </div>
    );
}
