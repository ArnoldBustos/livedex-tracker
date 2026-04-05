// SUPPORTED_GAMES lists the persisted save-title values shared by frontend and backend upload flows.
export const SUPPORTED_GAMES = [
    "RUBY",
    "SAPPHIRE",
    "EMERALD",
    "FIRERED",
    "LEAFGREEN"
] as const;

// SupportedGame stores the normalized save-title values persisted for uploads and save profiles.
export type SupportedGame = (typeof SUPPORTED_GAMES)[number];

// MANUAL_GEN3_GAME_OVERRIDES lists the allowed manual FRLG title choices accepted by the upload flow.
export const MANUAL_GEN3_GAME_OVERRIDES = [
    "FIRERED",
    "LEAFGREEN"
] as const;

// ManualGen3GameOverride stores the FRLG-only game values a user can choose when auto-detection is inconclusive.
export type ManualGen3GameOverride = (typeof MANUAL_GEN3_GAME_OVERRIDES)[number];

// SharedGen3Layout stores the Gen 3 parser layout family exposed to upload orchestration code.
export type SharedGen3Layout = "EMERALD" | "FRLG";

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
