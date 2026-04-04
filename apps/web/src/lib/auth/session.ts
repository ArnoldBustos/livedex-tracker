const AUTH_SESSION_STORAGE_KEY = "livedex.currentUser";

export type StoredUser = {
    id: string;
    email: string;
    username: string;
};

// loadStoredUser reads the persisted user from localStorage on app startup
// App.tsx calls this when initializing auth state
export const loadStoredUser = (): StoredUser | null => {
    const storedUser = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as StoredUser;
    } catch (error) {
        console.error("Failed to parse stored user session", error);
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        return null;
    }
};

// saveStoredUser writes the current user to localStorage after login or guest entry
// App.tsx calls this when auth state changes
export const saveStoredUser = (currentUser: StoredUser) => {
    window.localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(currentUser)
    );
};

// clearStoredUser removes the persisted auth session from localStorage
// App.tsx will call this during logout later
export const clearStoredUser = () => {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};