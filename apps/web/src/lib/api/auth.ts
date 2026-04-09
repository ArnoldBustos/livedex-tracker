import { apiRequest } from "./client";

type AuthUserResponse = {
    user: {
        id: string;
        email: string;
        username: string;
    };
};

type SessionResponse = {
    session: {
        user: {
            id: string;
            email: string;
            username: string;
        };
    } | null;
};

// signInWithPassword sends the real email-plus-password sign-in request and returns the signed-in user payload.
// App.tsx calls this when the entry auth modal submits sign-in credentials.
export const signInWithPassword = async ({
    email,
    password
}: {
    email: string;
    password: string;
}) => {
    return apiRequest<AuthUserResponse>("/auth/sign-in", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });
};

// signUpWithPassword sends the real email-plus-password sign-up request and returns the created signed-in user payload.
// App.tsx calls this when the entry auth modal submits new account credentials.
export const signUpWithPassword = async ({
    email,
    password
}: {
    email: string;
    password: string;
}) => {
    return apiRequest<AuthUserResponse>("/auth/sign-up", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });
};

// signOutSession clears the current authenticated session cookie.
// App.tsx calls this when the signed-in user chooses Sign Out.
export const signOutSession = async () => {
    return apiRequest<{ success: boolean }>("/auth/sign-out", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });
};

// fetchCurrentSession loads the current authenticated session from the server cookie and returns the mapped app user payload.
// App.tsx calls this on startup so signed-in state comes from the real session rather than local storage.
export const fetchCurrentSession = async () => {
    return apiRequest<SessionResponse>("/auth/session");
};
