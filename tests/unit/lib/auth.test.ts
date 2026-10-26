import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { CredentialsConfig } from "next-auth/providers/credentials";

import { authOptions, getServerAuth } from "@/lib/auth";

vi.mock("next-auth", async (importOriginal) => ({
    ...(await importOriginal<typeof import("next-auth")>()),
    getServerSession: vi.fn(),
}));

/* Credentials() keeps the authorize function we passed it in `options` */
const provider = authOptions.providers[0] as CredentialsConfig & {
    options: CredentialsConfig;
};

function login(username?: string, password?: string) {
    const credentials =
        username === undefined && password === undefined
            ? undefined
            : { username: username ?? "", password: password ?? "" };

    return provider.options.authorize(credentials, {} as never);
}

describe("authorize", () => {
    beforeEach(() => {
        vi.stubEnv("ADMIN_USERNAME", "admin");
        vi.stubEnv("ADMIN_PASSWORD", "s3cret");
    });

    it("logs in the admin with the right credentials", async () => {
        expect(await login("admin", "s3cret")).toEqual({
            id: "admin",
            name: "Admin User",
            role: "admin",
        });
    });

    it.each([
        ["a wrong username", "Admin", "s3cret"],
        ["a wrong password", "admin", "s3cret "],
        ["a password prefix", "admin", "s3c"],
        ["swapped credentials", "s3cret", "admin"],
        ["an empty username", "", "s3cret"],
        ["an empty password", "admin", ""],
    ])("rejects %s", async (_, username, password) => {
        expect(await login(username, password)).toBeNull();
    });

    it("rejects a request without credentials", async () => {
        expect(await login()).toBeNull();
    });

    /* Regression guard: without the env vars, an empty login must not match undefined === undefined */
    it.each([
        ["ADMIN_USERNAME", "ADMIN_PASSWORD"],
        ["ADMIN_USERNAME"],
        ["ADMIN_PASSWORD"],
    ])("rejects every login when %s isn't set", async (...missing) => {
        for (const name of missing) {
            vi.stubEnv(name, undefined);
        }

        expect(await login()).toBeNull();
        expect(await login("", "")).toBeNull();
        expect(await login("admin", "s3cret")).toBeNull();
    });
});

describe("callbacks", () => {
    it("copies the user's role into the token at login", async () => {
        const token = await authOptions.callbacks!.jwt!({
            token: {},
            user: { id: "admin", role: "admin" } as User,
        } as never);

        expect(token).toMatchObject({ role: "admin" });
    });

    it("keeps the token's role on later requests", async () => {
        const token = await authOptions.callbacks!.jwt!({
            token: { role: "admin" },
        } as never);

        expect(token).toMatchObject({ role: "admin" });
    });

    it("exposes the token's role on the session", async () => {
        const session = await authOptions.callbacks!.session!({
            session: { user: { name: "Admin User" }, expires: "" },
            token: { role: "admin" } as JWT,
        } as never);

        expect((session as Session).user.role).toBe("admin");
    });
});

describe("session", () => {
    it("lasts 6 hours", () => {
        expect(authOptions.session?.maxAge).toBe(6 * 60 * 60);
    });
});

describe("getServerAuth", () => {
    it("returns an admin session", async () => {
        const session = { user: { role: "admin" }, expires: "" };
        vi.mocked(getServerSession).mockResolvedValue(session);

        expect(await getServerAuth()).toBe(session);
        expect(getServerSession).toHaveBeenCalledWith(authOptions);
    });

    it.each([
        [
            "a session with another role",
            { user: { role: "editor" }, expires: "" },
        ],
        ["a session without a role", { user: {}, expires: "" }],
        ["no session", null],
    ])("returns null for %s", async (_, session) => {
        vi.mocked(getServerSession).mockResolvedValue(session);

        expect(await getServerAuth()).toBeNull();
    });
});
