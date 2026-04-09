const LEGACY_AUTH_SESSION_STORAGE_KEY = "livedex.currentUser";
const GUEST_SESSION_STORAGE_KEY = "livedex.guestUser";

export type StoredUser = {
    id: string;
    email: string;
    username: string;
};

export type RestoredSession =
    | {
        mode: "guest";
        user: StoredUser;
    }
    | {
        mode: "auth";
        user: null;
    };

// getIsGuestUser checks whether a stored user should be treated as a guest session.
// App.tsx and API helpers use this so guest mode can stay local while signed-in auth comes from server cookies.
export const getIsGuestUser = (currentUser: StoredUser | null) => {
    if (!currentUser) {
        return false;
    }

    return currentUser.id === "guest";
};

// loadStoredGuestUser reads the persisted guest session and removes invalid serialized data.
// restoreSession uses this so guest mode can survive refresh without treating local storage as proof of signed-in auth.
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

// restoreSession restores only the guest session because signed-in auth is now fetched from the server session cookie.
// App.tsx calls this during initialization so guest refresh behavior remains explicit and secure.
export const restoreSession = (): RestoredSession => {
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

// saveStoredUser persists only guest sessions and clears any legacy signed-in local storage state.
// App.tsx calls this when guest mode changes so old fake-auth local user state can no longer act as sign-in proof.
export const saveStoredUser = (currentUser: StoredUser) => {
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);

    if (!getIsGuestUser(currentUser)) {
        window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(
        GUEST_SESSION_STORAGE_KEY,
        JSON.stringify(currentUser)
    );
};

// clearStoredUser removes both guest state and any leftover legacy signed-in local storage entry.
// App.tsx calls this when auth mode changes so the browser stops carrying fake-auth residue between reloads.
export const clearStoredUser = () => {
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
};
