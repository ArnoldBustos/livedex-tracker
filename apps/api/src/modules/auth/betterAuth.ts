import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import prismaClient from "../../lib/prisma";
import { env } from "../../config/env";
import { hashAuthPassword, verifyAuthPassword } from "./passwordHash.service";

// auth stores the Better Auth instance mounted by Express and reused by auth wrapper routes.
// app.ts, auth.controller.ts, and authSession.service.ts import this so session behavior stays behind one boundary.
export const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_ORIGIN],
    database: prismaAdapter(prismaClient, {
        provider: "postgresql"
    }),
    user: {
        modelName: "User",
        fields: {
            name: "username"
        }
    },
    session: {
        modelName: "Session",
        fields: {
            userId: "userId"
        }
    },
    account: {
        modelName: "Account",
        fields: {
            userId: "userId"
        }
    },
    verification: {
        modelName: "Verification"
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        password: {
            hash: hashAuthPassword,
            verify: verifyAuthPassword
        }
    }
});
