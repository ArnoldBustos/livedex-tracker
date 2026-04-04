const API_BASE_URL = "http://localhost:4000";

// deleteSaveProfile sends the delete request for one save profile
// App.tsx calls this to remove a profile from the backend
export const deleteSaveProfile = async (saveProfileId: string) => {
    const response = await fetch(`${API_BASE_URL}/uploads/profiles/${saveProfileId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Failed to delete profile");
    }

    return true;
};