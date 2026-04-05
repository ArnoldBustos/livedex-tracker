import { apiRequest } from "./client";
import type {
    DexResponse,
    SaveProfileRecord,
    UploadFlowResult,
    UploadRequestFields,
    UploadResponse
} from "../../types/save";
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

// buildUploadSaveFormData creates the multipart payload shared by initial uploads and FRLG override resubmits.
// App.tsx calls this so file upload request fields stay centralized outside component code.
export const buildUploadSaveFormData = ({
    file,
    requestFields
}: {
    file: File;
    requestFields: UploadRequestFields;
}) => {
    const formData = new FormData();

    formData.append("saveFile", file);

    if (requestFields.saveProfileName) {
        formData.append("saveProfileName", requestFields.saveProfileName);
    }

    if (requestFields.saveProfileId) {
        formData.append("saveProfileId", requestFields.saveProfileId);
    }

    if (requestFields.manualGameOverride) {
        formData.append("manualGameOverride", requestFields.manualGameOverride);
    }

    return formData;
};

// uploadSaveFile uploads a new or replacement save file using multipart form data
// App.tsx calls this for both new uploads and active-profile updates
export const uploadSaveFile = async (
    formData: FormData,
    currentUser: ApiClientUser
) => {
    return apiRequest<UploadFlowResult>("/uploads", {
        method: "POST",
        currentUser,
        body: formData
    });
};

// uploadSaveAndFetchDex creates or updates a save upload and then loads dex data
// Signed-in users fetch persisted dex rows, while guest users use dex returned directly from upload response
export const uploadSaveAndFetchDex = async (
    formData: FormData,
    currentUser: ApiClientUser
) => {
    const uploadResponse = await uploadSaveFile(formData, currentUser);

    if (uploadResponse.status === "manual-game-selection-required") {
        return uploadResponse;
    }

    if (uploadResponse.dex) {
        if (!uploadResponse.dex) {
            throw new Error("Guest upload did not return dex data.");
        }

        return {
            uploadResponse,
            dexResponse: uploadResponse.dex
        };
    }

    const dexResponse = await fetchDexBySaveProfileId(
        uploadResponse.saveProfile.id,
        currentUser
    );

    return {
        uploadResponse,
        dexResponse
    };
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
