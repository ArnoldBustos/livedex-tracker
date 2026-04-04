const AUTH_SESSION_STORAGE_KEY = "livedex.currentUser";
const GUEST_SESSION_STORAGE_KEY = "livedex.guestUser";

export type StoredUser = {
    id: string;
    email: string;
    username: string;
};

// getIsGuestUser checks whether the current stored user represents guest mode
// App.tsx and session helpers use this to separate guest behavior from signed-in account behavior
export const getIsGuestUser = (currentUser: StoredUser | null) => {
    return currentUser?.id === "guest";
};

// loadStoredUser reads a persisted signed-in user first, then falls back to a guest session
// App.tsx calls this during startup so both account and guest sessions can survive refresh
export const loadStoredUser = (): StoredUser | null => {
    const storedSignedInUser = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (storedSignedInUser) {
        try {
            return JSON.parse(storedSignedInUser) as StoredUser;
        } catch (error) {
            console.error("Failed to parse stored signed-in user session", error);
            window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        }
    }

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

// saveStoredUser writes signed-in users and guest users to separate storage keys
// App.tsx calls this when auth state changes so session modes remain isolated
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
// App.tsx calls this during logout so the app returns to a fully logged-out state
export const clearStoredUser = () => {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
};