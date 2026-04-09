import prismaClient from "../../lib/prisma";

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
    requiresRealAuthCredential: boolean;
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

    if (existingUser) {
        return {
            userId: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            created: false,
            requiresRealAuthCredential: true
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

    return {
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        created: true,
        requiresRealAuthCredential: true
    };
};
