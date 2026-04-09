import type { Request, Response, NextFunction } from "express";
import { getRequestAuthSession } from "../modules/auth/authSession.service";

// attachRequestUser resolves guest-mode headers and Better Auth sessions into request.user.
// app.ts registers this middleware so feature controllers can depend on request-user resolution without knowing auth internals.
export const attachRequestUser = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const guestModeHeader = request.header("x-livedex-guest");

    if (guestModeHeader === "true") {
        request.user = {
            id: "guest",
            email: "guest"
        };

        next();
        return;
    }

    getRequestAuthSession({
        request,
        response
    })
        .then((currentSession) => {
            if (currentSession) {
                request.user = {
                    id: currentSession.user.id,
                    email: currentSession.user.email
                };
            }

            next();
        })
        .catch((error) => {
            next(error);
        });
};
