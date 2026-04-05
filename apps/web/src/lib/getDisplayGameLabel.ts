import type { UploadResponse } from "../types/save";

// DisplayGameLabelParams defines the upload and saved-profile game fields used for one UI game label.
type DisplayGameLabelParams = {
    detectedGame: UploadResponse["upload"]["detectedGame"];
    detectedLayout: UploadResponse["debug"] extends infer DebugPayload
        ? DebugPayload extends { detectedLayout?: infer Layout }
            ? Layout
            : undefined
        : undefined;
    saveProfileGame: UploadResponse["saveProfile"]["game"];
    unknownLabel?: string;
};

// getDisplayGameLabel maps exact games and layout-family fallbacks into one consistent dashboard label.
export const getDisplayGameLabel = ({
    detectedGame,
    detectedLayout,
    saveProfileGame,
    unknownLabel = "Unknown Game"
}: DisplayGameLabelParams): string => {
    if (detectedGame) {
        return detectedGame;
    }

    if (detectedLayout === "RUBY_SAPPHIRE") {
        return "Ruby / Sapphire";
    }

    if (detectedLayout === "FRLG") {
        return "FireRed / LeafGreen";
    }

    if (detectedLayout === "EMERALD") {
        return "Emerald";
    }

    if (saveProfileGame) {
        return saveProfileGame;
    }

    return unknownLabel;
};
