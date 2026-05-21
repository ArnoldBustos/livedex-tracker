export {
    GEN3_MAX_NATIONAL_DEX_NUMBER,
    SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
} from "./pokedex";

import {
    GEN3_MAX_NATIONAL_DEX_NUMBER,
    SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER
} from "./pokedex";

// SUPPORTED_GAMES lists the persisted save-title values shared by frontend and backend upload flows.
export const SUPPORTED_GAMES = [
    "RUBY",
    "SAPPHIRE",
    "EMERALD",
    "FIRERED",
    "LEAFGREEN",
    "DIAMOND",
    "PEARL",
    "PLATINUM",
    "HEARTGOLD",
    "SOULSILVER"
] as const;

// SupportedGame stores the normalized save-title values persisted for uploads and save profiles.
export type SupportedGame = (typeof SUPPORTED_GAMES)[number];

export type SupportedGameGeneration = 3 | 4;

export type SupportedGameRegion = "KANTO" | "HOENN" | "SINNOH" | "JOHTO";

export type SupportedGameMetadata = {
    value: SupportedGame;
    label: string;
    generation: SupportedGameGeneration;
    region: SupportedGameRegion;
    maxNationalDexNumber: number;
    parserSupport: "gen3-save" | "manual-only";
};

const GEN3_SUPPORTED_GAMES = [
    "RUBY",
    "SAPPHIRE",
    "EMERALD",
    "FIRERED",
    "LEAFGREEN"
] as const satisfies readonly SupportedGame[];

const GAME_METADATA_BY_VALUE: Record<SupportedGame, SupportedGameMetadata> = {
    RUBY: {
        value: "RUBY",
        label: "Ruby",
        generation: 3,
        region: "HOENN",
        maxNationalDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "gen3-save"
    },
    SAPPHIRE: {
        value: "SAPPHIRE",
        label: "Sapphire",
        generation: 3,
        region: "HOENN",
        maxNationalDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "gen3-save"
    },
    EMERALD: {
        value: "EMERALD",
        label: "Emerald",
        generation: 3,
        region: "HOENN",
        maxNationalDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "gen3-save"
    },
    FIRERED: {
        value: "FIRERED",
        label: "FireRed",
        generation: 3,
        region: "KANTO",
        maxNationalDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "gen3-save"
    },
    LEAFGREEN: {
        value: "LEAFGREEN",
        label: "LeafGreen",
        generation: 3,
        region: "KANTO",
        maxNationalDexNumber: GEN3_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "gen3-save"
    },
    DIAMOND: {
        value: "DIAMOND",
        label: "Diamond",
        generation: 4,
        region: "SINNOH",
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "manual-only"
    },
    PEARL: {
        value: "PEARL",
        label: "Pearl",
        generation: 4,
        region: "SINNOH",
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "manual-only"
    },
    PLATINUM: {
        value: "PLATINUM",
        label: "Platinum",
        generation: 4,
        region: "SINNOH",
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "manual-only"
    },
    HEARTGOLD: {
        value: "HEARTGOLD",
        label: "HeartGold",
        generation: 4,
        region: "JOHTO",
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "manual-only"
    },
    SOULSILVER: {
        value: "SOULSILVER",
        label: "SoulSilver",
        generation: 4,
        region: "JOHTO",
        maxNationalDexNumber: SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER,
        parserSupport: "manual-only"
    }
};

export const SUPPORTED_GAME_METADATA = SUPPORTED_GAMES.map((supportedGame) => {
    return GAME_METADATA_BY_VALUE[supportedGame];
});

export const getSupportedGameMetadata = (
    game: SupportedGame | null | undefined
) => {
    if (!game) {
        return null;
    }

    return GAME_METADATA_BY_VALUE[game];
};

export const getSupportedGameLabel = (
    game: SupportedGame | null | undefined
) => {
    return getSupportedGameMetadata(game)?.label ?? null;
};

export const getGameGeneration = (
    game: SupportedGame | null | undefined
) => {
    return getSupportedGameMetadata(game)?.generation ?? null;
};

export const KANTO_REGIONAL_DEX_NUMBERS = Array.from(
    {
        length: 151
    },
    (_, index) => {
        return index + 1;
    }
);

export const HOENN_REGIONAL_DEX_NUMBERS = [
    252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265,
    266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279,
    280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 63, 64, 65, 290, 291,
    292, 293, 294, 295, 296, 297, 118, 119, 129, 130, 298, 183, 184, 74, 75,
    76, 299, 300, 301, 41, 42, 169, 72, 73, 302, 303, 304, 305, 306, 66, 67,
    68, 307, 308, 309, 310, 311, 312, 81, 82, 100, 101, 313, 314, 43, 44, 45,
    182, 84, 85, 315, 316, 317, 318, 319, 320, 321, 322, 323, 218, 219, 324,
    88, 89, 109, 110, 325, 326, 27, 28, 327, 227, 328, 329, 330, 331, 332,
    333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346,
    347, 348, 174, 39, 40, 349, 350, 351, 120, 121, 352, 353, 354, 355, 356,
    357, 358, 359, 37, 38, 172, 25, 26, 54, 55, 360, 202, 177, 178, 203, 231,
    232, 127, 214, 111, 112, 361, 362, 363, 364, 365, 366, 367, 368, 369,
    222, 170, 171, 370, 116, 117, 230, 371, 372, 373, 374, 375, 376, 377,
    378, 379, 380, 381, 382, 383, 384, 385, 386
];

export const getRegionalDexNumbersForGame = (
    game: SupportedGame | null | undefined
) => {
    const gameMetadata = getSupportedGameMetadata(game);

    if (gameMetadata?.region === "HOENN") {
        return HOENN_REGIONAL_DEX_NUMBERS;
    }

    if (gameMetadata?.region === "KANTO") {
        return KANTO_REGIONAL_DEX_NUMBERS;
    }

    return null;
};

// getMaxNationalDexNumberForGame returns the highest species usable in a specific save title.
// API and web dex builders use this so the app-wide species catalog can grow without leaking later species into older games.
export const getMaxNationalDexNumberForGame = (
    game: SupportedGame | null | undefined
) => {
    return getSupportedGameMetadata(game)?.maxNationalDexNumber ?? SUPPORTED_POKEDEX_MAX_NATIONAL_DEX_NUMBER;
};

// MANUAL_GEN3_GAME_OVERRIDES lists the allowed manual FRLG title choices accepted by the upload flow.
export const MANUAL_GEN3_GAME_OVERRIDES = [
    "FIRERED",
    "LEAFGREEN"
] as const;

// ManualGen3GameOverride stores the FRLG-only game values a user can choose when auto-detection is inconclusive.
export type ManualGen3GameOverride = (typeof MANUAL_GEN3_GAME_OVERRIDES)[number];

export const getHasGen3SaveParserSupport = (
    game: SupportedGame | null | undefined
) => {
    return Boolean(game && GEN3_SUPPORTED_GAMES.includes(game as typeof GEN3_SUPPORTED_GAMES[number]));
};

// SharedGen3Layout stores the Gen 3 parser layout family exposed to upload orchestration code.
export type SharedGen3Layout = "RUBY_SAPPHIRE" | "EMERALD" | "FRLG";

// UploadRequestFields stores the multipart text fields shared by frontend and backend upload requests.
export type UploadRequestFields = {
    saveProfileName?: string;
    saveProfileId?: string;
    manualGameOverride?: ManualGen3GameOverride;
};

// UploadManualGameSelectionRequirement describes the non-final upload response that asks the user to choose FRLG title.
export type UploadManualGameSelectionRequirement = {
    status: "manual-game-selection-required";
    detectedLayout: "FRLG";
    detectedGame: null;
    allowedGames: readonly ManualGen3GameOverride[];
    message: string;
};
