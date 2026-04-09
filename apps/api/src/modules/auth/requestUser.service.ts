import type { Request } from "express";

// resolveRequestUserId returns the attached request user id when present.
// controllers use this to keep uploads and dex modules isolated from Better Auth session internals.
export const resolveRequestUserId = async (request: Request) => {
    if (request.user && request.user.id) {
        return request.user.id;
    }

    return null;
};
