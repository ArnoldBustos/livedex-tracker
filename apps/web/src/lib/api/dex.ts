import { apiRequest } from "./client";
import type { StoredUser } from "../auth/session";
import type {
    DexResponse,
    UpdateDexEntryRequest
} from "../../types/save";

type PatchDexEntryOverrideParams = {
    saveProfileId: string;
    pokemonSpeciesId: number;
    patch: UpdateDexEntryRequest;
    currentUser: StoredUser;
};

// patchDexEntryOverride sends one signed-in dex override update to the backend.
// App.tsx calls this when a user manually edits seen, caught, or living state.
export const patchDexEntryOverride = async ({
    saveProfileId,
    pokemonSpeciesId,
    patch,
    currentUser
}: PatchDexEntryOverrideParams) => {
    return await apiRequest<DexResponse>(
        `/dex/profile/${saveProfileId}/entry/${pokemonSpeciesId}`,
        {
            method: "PATCH",
            currentUser,
            body: JSON.stringify(patch),
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
};

// fetchDexTemplate loads the blank dex template used by manual save creation.
// App.tsx calls this so manual entry reuses backend species data instead of duplicating it in the web app.
export const fetchDexTemplate = async () => {
    return await apiRequest<DexResponse>("/dex/template");
};
