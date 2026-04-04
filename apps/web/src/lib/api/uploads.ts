import { apiRequest } from "./client";
import type { DexResponse, SaveProfileRecord, UploadResponse } from "../../types/save";
import type { ApiClientUser } from "./client";

// loginWithEmail sends the email login request and returns the backend user payload
// App.tsx calls this during the first-entry sign-in flow
export const loginWithEmail = async (email: string) => {
    return apiRequest<{ user: { id: string; email: string; username: string } }>(
        "/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email
            })
        }
    );
};

// fetchSaveProfiles loads all save profiles for the current user
// App.tsx calls this after login or when session state is restored
export const fetchSaveProfiles = async (currentUser: ApiClientUser) => {
    return apiRequest<SaveProfileRecord[]>("/uploads/profiles", {
        currentUser
    });
};

// fetchSaveProfileById loads one save profile payload for the dashboard
// App.tsx calls this when switching between saved profiles
export const fetchSaveProfileById = async (
    saveProfileId: string,
    currentUser: ApiClientUser
) => {
    return apiRequest<UploadResponse>(`/uploads/profiles/${saveProfileId}`, {
        currentUser
    });
};

// fetchDexBySaveProfileId loads dex data for a selected save profile
// App.tsx calls this after upload or when switching profiles
export const fetchDexBySaveProfileId = async (
    saveProfileId: string,
    currentUser: ApiClientUser
) => {
    return apiRequest<DexResponse>(`/dex/profile/${saveProfileId}`, {
        currentUser
    });
};

// uploadSaveFile uploads a new or replacement save file using multipart form data
// App.tsx calls this for both new uploads and active-profile updates
export const uploadSaveFile = async (
    formData: FormData,
    currentUser: ApiClientUser
) => {
    return apiRequest<UploadResponse>("/uploads", {
        method: "POST",
        currentUser,
        body: formData
    });
};

// deleteSaveProfile sends the delete request for one save profile
// App.tsx calls this to remove a profile from the backend
export const deleteSaveProfile = async (
    saveProfileId: string,
    currentUser: ApiClientUser
) => {
    await apiRequest<null>(`/uploads/profiles/${saveProfileId}`, {
        method: "DELETE",
        currentUser
    });

    return true;
};