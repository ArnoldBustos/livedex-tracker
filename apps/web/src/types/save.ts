import { SUPPORTED_GAMES } from "../../../../packages/shared/src";
import type {
    ManualGen3GameOverride,
    SupportedGame,
    UploadManualGameSelectionRequirement,
    UploadRequestFields
} from "../../../../packages/shared/src";

export {
    SUPPORTED_GAMES
};

export type {
    ManualGen3GameOverride,
    SupportedGame,
    UploadManualGameSelectionRequirement,
    UploadRequestFields
};

// SaveSourceType distinguishes uploaded saves from frontend-created manual shells.
// App.tsx and save setup components use this so both entry paths share one identity model.
export type SaveSourceType = "upload" | "manual";

// EditableSaveIdentity stores the user-editable identity fields shared by upload and manual save setup.
// SaveDetailsForm and App.tsx use this so save naming stays modular instead of being duplicated per flow.
export type EditableSaveIdentity = {
    displayName: string;
    trainerName: string;
    game: SupportedGame | null;
    sourceType: SaveSourceType;
};

export type SaveProfileRecord = {
    id: string;
    userId: string;
    name: string;
    game: SupportedGame | null;
    createdAt: string;
    updatedAt: string;
};

export type UploadRecord = {
    id: string;
    userId: string;
    originalFilename: string;
    storageProvider: string;
    storageKey: string;
    fileUrl: string | null;
    fileSizeBytes: number;
    parseStatus: string;
    detectedGame: SupportedGame | null;
    parseError: string | null;
    createdAt: string;
    updatedAt: string;
};

export type TrainerInfo = {
    name: string;
    gender: string;
};

export type DebugPayload = {
    activeSaveIndex?: number;
    sectionIds?: number[];
    seenNationalDexNumbers?: number[];
    caughtNationalDexNumbers?: number[];
    ownedNationalDexNumbers?: number[];
    livingNationalDexNumbers?: number[];
    seenCount?: number;
    caughtCount?: number;
    ownedCount?: number;
    livingCount?: number;
    trainerName?: string;
    trainerGender?: string;
    partyCount?: number;
    partySpeciesIds?: number[];
    boxCount?: number;
    boxSpeciesIds?: number[];
    detectedLayout?: "EMERALD" | "FRLG";
    detectedGameReason?: string;
};

// UploadResponse stores the successful dashboard payload used for saved-profile reads and completed uploads.
export type UploadResponse = {
    upload: UploadRecord & {
        saveProfileId?: string;
        trainerName?: string | null;
        trainerGender?: string | null;
    };
    saveProfile: SaveProfileRecord;
    trainerInfo?: TrainerInfo;
    dex?: DexResponse;
    debug?: DebugPayload;
    editableIdentity?: EditableSaveIdentity;
};

// CompletedUploadFlowResponse stores the successful upload-endpoint payload before App.tsx moves into dashboard state.
export type CompletedUploadFlowResponse = UploadResponse & {
    status: "completed";
};

// UploadFlowResult stores either a completed upload payload or the FRLG manual title selection requirement.
export type UploadFlowResult =
    | CompletedUploadFlowResponse
    | UploadManualGameSelectionRequirement;

export type DexEntry = {
    pokemonSpeciesId: number;
    dexNumber: number;
    name: string;
    generation: number;
    primaryType: string;
    secondaryType: string | null;
    seen: boolean;
    caught: boolean;
    hasLivingEntry: boolean;
};

export type DexResponse = {
    summary: {
        totalEntries: number;
        seenCount: number;
        caughtCount: number;
        livingCount: number;
    };
    entries: DexEntry[];
};

// UpdateDexEntryRequest is the backend PATCH payload for one dex entry override.
// lib/api/dex.ts uses this for signed-in manual dex edits.
export type UpdateDexEntryRequest = {
    seen?: boolean | null;
    caught?: boolean | null;
    hasLivingEntry?: boolean | null;
};

// GuestDexOverrideValue stores one guest-only dex override for a single species.
// App.tsx uses this value shape inside GuestDexOverrideMap for local manual edits.
export type GuestDexOverrideValue = {
    seen?: boolean;
    caught?: boolean;
    hasLivingEntry?: boolean;
};

// GuestDexOverrideMap stores temporary guest-only dex edits keyed by species id.
// App.tsx uses this so guest manual edits never hit the backend.
export type GuestDexOverrideMap = Record<number, GuestDexOverrideValue>;

export type DexFilter =
    | "all"
    | "living"
    | "missing"
    | "seenOnly"
    | "caughtNotLiving";

export type DexScope = "national" | "regional";

// DexGridDensity defines the five dashboard card density options for the dex grid.
// App.tsx stores this selection and LoadedDashboardView uses it to choose grid sizing.
export type DexGridDensity =
    | "extraComfortable"
    | "comfortable"
    | "default"
    | "compact"
    | "extraCompact";

export type DexDisplayStatus = "living" | "caught" | "seen" | "missing";
