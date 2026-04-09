import type { Request } from "express";
import prismaClient from "../../lib/prisma";
import { LOCAL_DEV_ACCOUNT_EMAIL } from "./localDevAccount.service";

// getDevUserId returns the seeded development user id for local fallback flows.
// dex and uploads controllers use this until full auth replaces the dev default.
// TODO: Remove this fallback when real session auth is the only request identity source.
export const getDevUserId = async () => {
    const devUser = await prismaClient.user.findUnique({
        where: {
            email: LOCAL_DEV_ACCOUNT_EMAIL
        },
        select: {
            id: true
        }
    });

    return devUser ? devUser.id : null;
};

// resolveRequestUserId returns the attached request user id when present.
// controllers use this to keep ownership checks and dev fallback behavior consistent.
// TODO: Resolve only real authenticated sessions after the auth migration removes the dev fallback.
export const resolveRequestUserId = async (request: Request) => {
    if (request.user && request.user.id) {
        return request.user.id;
    }

    return await getDevUserId();
};
