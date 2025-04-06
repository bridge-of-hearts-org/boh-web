"use client";

import { signOut } from "next-auth/react";

import Button from "@/components/Button";

export default function Dashboard() {
    return (
        <div className="flex justify-center">
            <Button
                name="Logout"
                onClick={() => signOut({ callbackUrl: "/directory" })}
            >
                Logout
            </Button>
        </div>
    );
}
