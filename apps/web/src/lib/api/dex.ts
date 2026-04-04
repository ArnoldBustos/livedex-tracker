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
