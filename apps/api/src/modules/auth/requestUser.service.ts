import type { Request } from "express";
import prismaClient from "../../lib/prisma";

// getDevUserId returns the seeded development user id for local fallback flows.
// dex and uploads controllers use this until full auth replaces the dev default.
export const getDevUserId = async () => {
    const devUser = await prismaClient.user.findUnique({
        where: {
            email: "dev@example.com"
        },
        select: {
            id: true
        }
    });

    return devUser ? devUser.id : null;
};

// resolveRequestUserId returns the attached request user id when present.
// controllers use this to keep ownership checks and dev fallback behavior consistent.
export const resolveRequestUserId = async (request: Request) => {
    if (request.user && request.user.id) {
        return request.user.id;
    }

    return await getDevUserId();
};
