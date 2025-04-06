import Button from "@/components/Button";
import { getServerAuth } from "@/lib/auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard";

export default async function AdminDashboard() {
    const session = await getServerAuth();

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className="flex justify-center text-2xl font-semibold">
                Admin Dashboard
            </h1>
            <Dashboard />
        </div>
    );
}
