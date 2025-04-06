"use client";

import Button from "@/components/Button";
import { signOut } from "next-auth/react";

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
