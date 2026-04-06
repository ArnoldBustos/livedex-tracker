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

// UpdateSaveProfileRequest stores the editable metadata fields for one saved profile.
// App.tsx and uploads API helpers use this so profile metadata edits stay separate from file uploads.
export type UpdateSaveProfileRequest = {
    name: string;
    game: SupportedGame | null;
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
    hasNationalDex?: boolean;
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
    detectedLayout?: "RUBY_SAPPHIRE" | "EMERALD" | "FRLG";
    detectedGameReason?: string;
    pokedexError?: string | null;
    partyError?: string | null;
    boxError?: string | null;
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

// DexEntryCollectionState stores one collection layer for a dex entry.
// DexEntry and dex update request types reuse this so standard and shiny flags stay structurally aligned.
export type DexEntryCollectionState = {
    seen: boolean;
    caught: boolean;
    hasLivingEntry: boolean;
};

// DexEntryOwnershipState stores ownership counters for one dex entry.
// DexEntry uses this so ownership counts can expand without changing the collection flag layers.
export type DexEntryOwnershipState = {
    totalOwnedCount: number;
    shinyOwnedCount: number;
};

export type DexEntry = {
    pokemonSpeciesId: number;
    dexNumber: number;
    name: string;
    generation: number;
    primaryType: string;
    secondaryType: string | null;
    standard: DexEntryCollectionState;
    shiny: DexEntryCollectionState;
    ownership: DexEntryOwnershipState;
};

// DexSummaryCollectionState stores aggregate totals for one dex collection layer.
// DexResponse.summary uses this so standard and shiny totals stay parallel and modular.
export type DexSummaryCollectionState = {
    totalEntries: number;
    seenCount: number;
    caughtCount: number;
    livingCount: number;
};

// DexSummaryOwnershipState stores aggregate ownership totals across the dex.
// DexResponse.summary uses this so ownership counters stay separate from boolean collection totals.
export type DexSummaryOwnershipState = {
    totalOwnedCount: number;
    totalShinyOwnedCount: number;
};

export type DexResponse = {
    summary: {
        standard: DexSummaryCollectionState;
        shiny: DexSummaryCollectionState;
        ownership: DexSummaryOwnershipState;
    };
    entries: DexEntry[];
};

// DexEntryCollectionPatch stores nullable override writes for one dex collection layer.
// UpdateDexEntryRequest and guest override types reuse this so standard and shiny edits share one patch contract.
export type DexEntryCollectionPatch = {
    seen?: boolean | null;
    caught?: boolean | null;
    hasLivingEntry?: boolean | null;
};

// UpdateDexEntryRequest is the backend PATCH payload for one dex entry override.
// lib/api/dex.ts uses this for signed-in manual dex edits.
export type UpdateDexEntryRequest = {
    standard?: DexEntryCollectionPatch;
    shiny?: DexEntryCollectionPatch;
};

// GuestDexOverrideValue stores one guest-only dex override for a single species.
// App.tsx uses this value shape inside GuestDexOverrideMap for local manual edits.
export type GuestDexOverrideValue = {
    standard?: DexEntryCollectionPatch;
    shiny?: DexEntryCollectionPatch;
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

// DexCollectionLayerKey identifies the parallel dex data layers exposed by the API.
// App.tsx and dashboard components use this so standard and shiny logic can share helpers without collapsing together.
export type DexCollectionLayerKey = "standard" | "shiny";

// DexGridDensity defines the five dashboard card density options for the dex grid.
// App.tsx stores this selection and LoadedDashboardView uses it to choose grid sizing.
export type DexGridDensity =
    | "extraComfortable"
    | "comfortable"
    | "default"
    | "compact"
    | "extraCompact";

export type DexDisplayStatus = "living" | "caught" | "seen" | "missing";
