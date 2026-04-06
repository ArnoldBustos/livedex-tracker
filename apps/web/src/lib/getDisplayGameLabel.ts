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

// getFormattedSupportedGameLabel converts one supported-game enum value into the UI label used across profile and upload surfaces.
// getDisplayGameLabel uses this so saved-profile rows and exact detected games share the same display formatting.
const getFormattedSupportedGameLabel = (
    supportedGame: UploadResponse["saveProfile"]["game"]
) => {
    if (supportedGame === "RUBY") {
        return "Ruby";
    }

    if (supportedGame === "SAPPHIRE") {
        return "Sapphire";
    }

    if (supportedGame === "EMERALD") {
        return "Emerald";
    }

    if (supportedGame === "FIRERED") {
        return "FireRed";
    }

    if (supportedGame === "LEAFGREEN") {
        return "LeafGreen";
    }

    return null;
};

// getDisplayGameLabel maps exact games and layout-family fallbacks into one consistent dashboard label.
export const getDisplayGameLabel = ({
    detectedGame,
    detectedLayout,
    saveProfileGame,
    unknownLabel = "Unknown Game"
}: DisplayGameLabelParams): string => {
    const formattedSaveProfileGameLabel = getFormattedSupportedGameLabel(saveProfileGame);

    if (formattedSaveProfileGameLabel) {
        return formattedSaveProfileGameLabel;
    }

    const formattedDetectedGameLabel = getFormattedSupportedGameLabel(detectedGame);

    if (formattedDetectedGameLabel) {
        return formattedDetectedGameLabel;
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

    return unknownLabel;
};
