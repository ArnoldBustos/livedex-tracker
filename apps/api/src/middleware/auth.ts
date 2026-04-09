import type { Request, Response, NextFunction } from "express";

// attachRequestUser reads simple auth headers and attaches a request user when present
// app.ts will register this middleware so controllers can read request.user
// TODO: Remove trusted identity headers when real session middleware replaces the fake auth flow.
export const attachRequestUser = (
    request: Request,
    _response: Response,
    next: NextFunction
) => {
    const userIdHeader = request.header("x-user-id");
    const userEmailHeader = request.header("x-user-email");

    if (userIdHeader && userEmailHeader) {
        request.user = {
            id: userIdHeader,
            email: userEmailHeader
        };
    }

    next();
};
