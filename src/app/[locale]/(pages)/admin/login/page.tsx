"use client";

import Form from "next/form";
import { useState, Suspense } from "react";
import Button from "@/components/Button";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin";
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (data: FormData) => {
        const res = await signIn("credentials", {
            username: data.get("username")?.toString() || "",
            password: data.get("password")?.toString() || "",
            callbackUrl: callbackUrl,
            redirect: false,
        });

        if (res?.error) {
            setErrorMessage("Invalid username or password");
        } else if (res?.ok && res?.url) {
            setErrorMessage(null);
            router.push(res.url);
        } else {
            setErrorMessage(`Unexpected error: ${res}`);
        }
    };

    return (
        <Form
            action={handleSubmit}
            className="flex flex-col items-center gap-5"
        >
            <input
                id="username"
                name="username"
                type="text"
                placeholder="Username"
            />
            <input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
            />
            <Button name="Login" type="submit">
                Login
            </Button>

            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </Form>
    );
}

// Loading fallback component
function LoginFormFallback() {
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-full animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
        </Suspense>
    );
}
