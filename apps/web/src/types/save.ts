export type SaveProfileRecord = {
    id: string;
    userId: string;
    name: string;
    game: string | null;
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
    detectedGame: string | null;
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
    ownedNationalDexNumbers?: number[];
    seenCount?: number;
    ownedCount?: number;
    trainerName?: string;
    trainerGender?: string;
};

export type UploadResponse = {
    upload: UploadRecord;
    saveProfile: SaveProfileRecord;
    trainerInfo?: TrainerInfo;
    debug?: DebugPayload;
};

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

export type DexFilter =
    | "all"
    | "living"
    | "missing"
    | "seenOnly"
    | "caughtNotLiving";

export type DexScope = "national" | "regional";

export type DexDisplayStatus = "living" | "caught" | "seen" | "missing";
