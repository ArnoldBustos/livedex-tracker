const AUTH_SESSION_STORAGE_KEY = "livedex.currentUser";
const GUEST_SESSION_STORAGE_KEY = "livedex.guestUser";

export type StoredUser = {
    id: string;
    email: string;
    username: string;
};

export type RestoredSession =
    | {
        mode: "user";
        user: StoredUser;
    }
    | {
        mode: "guest";
        user: StoredUser;
    }
    | {
        mode: "auth";
        user: null;
    };

// getIsGuestUser checks whether a stored user should be treated as a guest session
// App.tsx and save helpers use this to keep guest and signed-in session flows separate
export const getIsGuestUser = (currentUser: StoredUser | null) => {
    if (!currentUser) {
        return false;
    }

    return currentUser.id === "guest";
};

// loadStoredSignedInUser reads only the persisted signed-in account session
// restoreSession uses this first so real account sessions always win over guest fallback
export const loadStoredSignedInUser = (): StoredUser | null => {
    const storedSignedInUser = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!storedSignedInUser) {
        return null;
    }

    try {
        return JSON.parse(storedSignedInUser) as StoredUser;
    } catch (error) {
        console.error("Failed to parse stored signed-in user session", error);
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        return null;
    }
};

// loadStoredGuestUser reads only the persisted guest session
// restoreSession uses this only when no signed-in account session exists
export const loadStoredGuestUser = (): StoredUser | null => {
    const storedGuestUser = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);

    if (!storedGuestUser) {
        return null;
    }

    try {
        return JSON.parse(storedGuestUser) as StoredUser;
    } catch (error) {
        console.error("Failed to parse stored guest session", error);
        window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
        return null;
    }
};

// restoreSession determines the startup session mode in one place
// App.tsx calls this during initialization so refresh behavior is explicit and stable
export const restoreSession = (): RestoredSession => {
    const storedSignedInUser = loadStoredSignedInUser();

    if (storedSignedInUser) {
        return {
            mode: "user",
            user: storedSignedInUser
        };
    }

    const storedGuestUser = loadStoredGuestUser();

    if (storedGuestUser) {
        return {
            mode: "guest",
            user: storedGuestUser
        };
    }

    return {
        mode: "auth",
        user: null
    };
};

// saveStoredUser writes signed-in users and guest users to separate storage keys
// App.tsx calls this when auth state changes so session persistence stays mode-aware
export const saveStoredUser = (currentUser: StoredUser) => {
    if (getIsGuestUser(currentUser)) {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        window.localStorage.setItem(
            GUEST_SESSION_STORAGE_KEY,
            JSON.stringify(currentUser)
        );
        return;
    }

    window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
    window.localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(currentUser)
    );
};

// clearStoredUser removes both signed-in and guest session storage entries
// App.tsx calls this during logout so the app always returns to the auth state
export const clearStoredUser = () => {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
};