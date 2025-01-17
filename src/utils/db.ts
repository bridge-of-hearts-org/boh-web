import { PrismaClient } from "@prisma/client";

const gPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = gPrisma.prisma || new PrismaClient();

/* Use the global var only in development */
if (process.env.NODE_ENV !== "production") gPrisma.prisma = prisma;
