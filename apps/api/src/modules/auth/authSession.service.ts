import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./betterAuth";

type BetterAuthResponseWithHeaders<TResponse> = {
    headers: Headers;
    response: TResponse;
};

// applyBetterAuthHeaders copies Better Auth response headers such as refreshed cookies onto the Express response.
// authSession.service.ts uses this after session and sign-in actions so the browser receives the authoritative cookie state.
export const applyBetterAuthHeaders = ({
    headers,
    response
}: {
    headers: Headers;
    response: Response;
}) => {
    const setCookieValues =
        typeof headers.getSetCookie === "function"
            ? headers.getSetCookie()
            : [];

    if (setCookieValues.length > 0) {
        response.setHeader("Set-Cookie", setCookieValues);
    }

    headers.forEach((headerValue, headerName) => {
        if (headerName.toLowerCase() === "set-cookie") {
            return;
        }

        response.setHeader(headerName, headerValue);
    });
};

// getRequestAuthSession loads the current Better Auth session from the incoming request cookies and forwards refresh headers.
// middleware/auth.ts and auth.controller.ts call this so request identity stays session-backed without leaking auth internals.
export const getRequestAuthSession = async ({
    request,
    response
}: {
    request: Request;
    response: Response;
}) => {
    const sessionResult = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
        asResponse: false,
        returnHeaders: true
    }) as BetterAuthResponseWithHeaders<Awaited<ReturnType<typeof auth.api.getSession>>>;

    applyBetterAuthHeaders({
        headers: sessionResult.headers,
        response
    });

    return sessionResult.response;
};
