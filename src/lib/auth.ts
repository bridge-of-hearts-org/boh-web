import NextAuth, { getServerSession, NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
                const adminUser = {
                    username: process.env.ADMIN_USERNAME,
                    password: process.env.ADMIN_PASSWORD,
                };

                if (
                    credentials?.username === adminUser.username &&
                    credentials?.password === adminUser.password
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
