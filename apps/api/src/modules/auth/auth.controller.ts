import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAvailableUsernameForEmail, getStoredUserFromAuthUser } from "./authUser.service";
import { auth } from "./betterAuth";
import { applyBetterAuthHeaders, getRequestAuthSession } from "./authSession.service";
import { ensureLocalDevAccountForSignIn } from "./localDevAccount.service";

// getTrimmedAuthBodyValue reads one auth body field as a trimmed string.
// auth.controller.ts uses this so sign-up and sign-in validation stay centralized and consistent.
const getTrimmedAuthBodyValue = (request: Request, fieldName: string) => {
    const rawValue = request.body ? request.body[fieldName] : undefined;

    if (typeof rawValue !== "string") {
        return "";
    }

    return rawValue.trim();
};

// getAuthErrorStatus extracts one HTTP status code from a Better Auth or generic thrown error value.
// auth.controller.ts uses this so wrapper routes preserve auth failure semantics without exposing internal error shapes directly.
const getAuthErrorStatus = (error: unknown) => {
    if (error && typeof error === "object" && "status" in error) {
        const statusValue = (error as { status: unknown }).status;

        if (typeof statusValue === "number") {
            return statusValue;
        }
    }

    return 400;
};

// getAuthErrorMessage extracts one user-facing auth error message from a Better Auth or generic thrown error value.
// auth.controller.ts uses this so wrapper routes can return concise API errors while Better Auth handles session internals.
const getAuthErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Authentication request failed";
};

// signUpWithEmailPassword creates one Better Auth email/password account and returns the current signed-in user payload.
// auth.routes.ts uses this so the frontend can keep the current entry modal UX while session cookies become real.
export const signUpWithEmailPassword = async (request: Request, response: Response) => {
    const email = getTrimmedAuthBodyValue(request, "email").toLowerCase();
    const password = getTrimmedAuthBodyValue(request, "password");

    if (!email) {
        response.status(400).json({
            error: "Email is required"
        });
        return;
    }

    if (!password) {
        response.status(400).json({
            error: "Password is required"
        });
        return;
    }

    try {
        const generatedUsername = await getAvailableUsernameForEmail(email);
        const signUpResult = await auth.api.signUpEmail({
            headers: fromNodeHeaders(request.headers),
            body: {
                email,
                password,
                name: generatedUsername
            },
            asResponse: false,
            returnHeaders: true
        }) as {
            headers: Headers;
            response: {
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };

        applyBetterAuthHeaders({
            headers: signUpResult.headers,
            response
        });
        response.status(201).json({
            user: getStoredUserFromAuthUser(signUpResult.response.user)
        });
    } catch (error) {
        response.status(getAuthErrorStatus(error)).json({
            error: getAuthErrorMessage(error)
        });
    }
};

// signInWithEmailPassword authenticates one existing user through Better Auth and returns the signed-in user payload.
// auth.routes.ts uses this so the entry modal can replace the old email-only login flow with real session auth.
export const signInWithEmailPassword = async (request: Request, response: Response) => {
    const email = getTrimmedAuthBodyValue(request, "email").toLowerCase();
    const password = getTrimmedAuthBodyValue(request, "password");

    if (!email) {
        response.status(400).json({
            error: "Email is required"
        });
        return;
    }

    if (!password) {
        response.status(400).json({
            error: "Password is required"
        });
        return;
    }

    try {
        await ensureLocalDevAccountForSignIn(email);

        const signInResult = await auth.api.signInEmail({
            headers: fromNodeHeaders(request.headers),
            body: {
                email,
                password
            },
            asResponse: false,
            returnHeaders: true
        }) as {
            headers: Headers;
            response: {
                user: {
                    id: string;
                    email: string;
                    name: string;
                };
            };
        };

        applyBetterAuthHeaders({
            headers: signInResult.headers,
            response
        });
        response.status(200).json({
            user: getStoredUserFromAuthUser(signInResult.response.user)
        });
    } catch (error) {
        response.status(getAuthErrorStatus(error)).json({
            error: getAuthErrorMessage(error)
        });
    }
};

// signOutCurrentSession clears the active Better Auth session cookie for the current browser session.
// auth.routes.ts uses this so the frontend can log out without handling Better Auth internals directly.
export const signOutCurrentSession = async (request: Request, response: Response) => {
    try {
        const signOutResult = await auth.api.signOut({
            headers: fromNodeHeaders(request.headers),
            asResponse: false,
            returnHeaders: true
        }) as {
            headers: Headers;
            response: {
                success: boolean;
            };
        };

        applyBetterAuthHeaders({
            headers: signOutResult.headers,
            response
        });
        response.status(200).json({
            success: signOutResult.response.success
        });
    } catch (error) {
        response.status(getAuthErrorStatus(error)).json({
            error: getAuthErrorMessage(error)
        });
    }
};

// getCurrentSession returns the current Better Auth session mapped into the app's shared signed-in user payload.
// auth.routes.ts uses this for app bootstrap so signed-in state comes from the real session cookie instead of local storage.
export const getCurrentSession = async (request: Request, response: Response) => {
    try {
        const currentSession = await getRequestAuthSession({
            request,
            response
        });

        if (!currentSession) {
            response.status(200).json({
                session: null
            });
            return;
        }

        response.status(200).json({
            session: {
                user: getStoredUserFromAuthUser(currentSession.user)
            }
        });
    } catch (error) {
        response.status(getAuthErrorStatus(error)).json({
            error: getAuthErrorMessage(error)
        });
    }
};
