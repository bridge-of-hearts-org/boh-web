"use client";

import { signOut } from "next-auth/react";

import Button from "@/components/Button";
import Link from "next/link";

export default function AdminActions() {
    return (
        <div className="flex justify-center gap-5">
            <Link href="/facility/new">
                <Button variant="secondary" color="green" name="Add New">
                    Add New
                </Button>
            </Link>
            <Button
                variant="secondary"
                color="red"
                name="Logout"
                onClick={() => signOut({ callbackUrl: "/directory" })}
            >
                Logout
            </Button>
        </div>
    );
}
