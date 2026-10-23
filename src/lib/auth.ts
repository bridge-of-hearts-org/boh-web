import NextAuth, { getServerSession, NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash, timingSafeEqual } from "node:crypto";

/* Constant-time string comparison. Hashing first gives equal-length buffers,
   which timingSafeEqual requires, without leaking the secret's length */
function safeEqual(a: string, b: string): boolean {
    const hashA = createHash("sha256").update(a).digest();
    const hashB = createHash("sha256").update(b).digest();
    return timingSafeEqual(hashA, hashB);
}

declare module "next-auth" {
    interface Session {
        user: {
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string | null;
        };
    }

    interface User {
        role?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string | null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Admin Login",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPassword = process.env.ADMIN_PASSWORD;

                /* Without this, a deployment missing the env vars would accept
                   a login with no username or password (undefined === undefined) */
                if (
                    !adminUsername ||
                    !adminPassword ||
                    !credentials?.username ||
                    !credentials?.password
                ) {
                    return null;
                }

                if (
                    safeEqual(credentials.username, adminUsername) &&
                    safeEqual(credentials.password, adminPassword)
                ) {
                    return {
                        id: "admin",
                        name: "Admin User",
                        role: "admin",
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            session.user.role = token.role;
            return session;
        },
        async jwt({ token, user }) {
            if (user) token.role = user.role;
            return token;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 6, // 6 hours
    },
};

export async function getServerAuth() {
    const session = await getServerSession(authOptions);
    return session?.user.role === "admin" ? session : null;
}
