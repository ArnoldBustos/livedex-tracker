import { env } from "../../config/env";
import prismaClient from "../../lib/prisma";
import { hashAuthPassword } from "./passwordHash.service";

// LOCAL_DEV_ACCOUNT_EMAIL stores the canonical email for the existing local development user row.
// seed.ts and setupLocalDevAccount.ts use this so future real auth attaches credentials to one stable account.
export const LOCAL_DEV_ACCOUNT_EMAIL = "dev@example.com";

// LOCAL_DEV_ACCOUNT_USERNAME stores the canonical username for the existing local development user row.
// seed.ts and setupLocalDevAccount.ts use this when the local development user must be created from scratch.
export const LOCAL_DEV_ACCOUNT_USERNAME = "devuser";

// LocalDevAccountBootstrapResult describes the canonical local development user and the next auth migration step.
// seed.ts and setupLocalDevAccount.ts return this shape so logs stay consistent across automatic and manual setup flows.
export type LocalDevAccountBootstrapResult = {
    userId: string;
    email: string;
    username: string;
    created: boolean;
    credentialReady: boolean;
};

// ensureLocalDevCredentialAccount upserts the credential account used by Better Auth for the canonical local dev user.
// ensureLocalDevAccount calls this behind the dev-only gate so dev@example.com can sign in through the real auth flow.
const ensureLocalDevCredentialAccount = async (userId: string) => {
    const hashedPassword = await hashAuthPassword(env.LOCAL_DEV_ACCOUNT_PASSWORD);

    await prismaClient.account.upsert({
        where: {
            providerId_accountId: {
                providerId: "credential",
                accountId: userId
            }
        },
        update: {
            userId,
            password: hashedPassword
        },
        create: {
            userId,
            accountId: userId,
            providerId: "credential",
            password: hashedPassword
        }
    });
};

// ensureLocalDevAccount finds or creates the canonical local development user without duplicating rows.
// seed.ts and setupLocalDevAccount.ts call this so dev@example.com keeps the same ownership record for save data.
export const ensureLocalDevAccount = async (): Promise<LocalDevAccountBootstrapResult> => {
    const existingUser = await prismaClient.user.findUnique({
        where: {
            email: LOCAL_DEV_ACCOUNT_EMAIL
        },
        select: {
            id: true,
            email: true,
            username: true
        }
    });

    if (existingUser && env.ENABLE_LOCAL_DEV_ACCOUNT) {
        await ensureLocalDevCredentialAccount(existingUser.id);
    }

    if (existingUser) {
        return {
            userId: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            created: false,
            credentialReady: env.ENABLE_LOCAL_DEV_ACCOUNT
        };
    }

    const createdUser = await prismaClient.user.create({
        data: {
            email: LOCAL_DEV_ACCOUNT_EMAIL,
            username: LOCAL_DEV_ACCOUNT_USERNAME
        },
        select: {
            id: true,
            email: true,
            username: true
        }
    });

    if (env.ENABLE_LOCAL_DEV_ACCOUNT) {
        await ensureLocalDevCredentialAccount(createdUser.id);
    }

    return {
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        created: true,
        credentialReady: env.ENABLE_LOCAL_DEV_ACCOUNT
    };
};
