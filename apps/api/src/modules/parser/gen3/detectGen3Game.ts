import type { Gen3SaveSection } from "./readGen3SaveSections";

// DetectedGen3Game is the parser-facing title result that upload flows persist for the save.
export type DetectedGen3Game = "EMERALD" | "FIRERED" | "LEAFGREEN" | null;

// Gen3Layout identifies which save offsets the parser should use for Gen 3 extraction.
export type Gen3Layout = "EMERALD" | "FRLG";

// DetectGen3GameResult carries both the parser layout choice and the user-facing detected title.
export type DetectGen3GameResult = {
    detectedGame: DetectedGen3Game;
    layout: Gen3Layout;
    debug: {
        trainerSectionWordAt00AC: number;
        emeraldSecurityKeyCopy: number;
        fireRedLeafGreenSecurityKeyCopy: number;
        partyCountAtFireRedLeafGreenOffset: number;
        partyCountAtEmeraldOffset: number;
        detectionReason: string;
    };
};

// DetectionDebugPayload captures the raw marker values that the layout heuristic compares.
type DetectionDebugPayload = {
    trainerSectionWordAt00AC: number;
    emeraldSecurityKeyCopy: number;
    fireRedLeafGreenSecurityKeyCopy: number;
    partyCountAtFireRedLeafGreenOffset: number;
    partyCountAtEmeraldOffset: number;
};

// TRAINER_INFO_SECTION_ID points at section 0, which contains the game-code/security-key marker area.
const TRAINER_INFO_SECTION_ID = 0;
// SECTION_ONE_ID points at section 1, which exposes different party offsets for FRLG vs Emerald.
const SECTION_ONE_ID = 1;
// SHARED_MARKER_OFFSET is the section 0 offset that stores the FRLG game code or Emerald security key.
const SHARED_MARKER_OFFSET = 0x00ac;
// EMERALD_SECURITY_KEY_COPY_OFFSET is the known Emerald copy of the section 0 security key.
const EMERALD_SECURITY_KEY_COPY_OFFSET = 0x01f4;
// FIRE_RED_LEAF_GREEN_SECURITY_KEY_COPY_OFFSET is the known FRLG copy of the security key.
const FIRE_RED_LEAF_GREEN_SECURITY_KEY_COPY_OFFSET = 0x0f20;
// FIRE_RED_LEAF_GREEN_PARTY_COUNT_OFFSET is the FRLG team size offset inside section 1.
const FIRE_RED_LEAF_GREEN_PARTY_COUNT_OFFSET = 0x0034;
// EMERALD_PARTY_COUNT_OFFSET is the Emerald team size offset inside section 1.
const EMERALD_PARTY_COUNT_OFFSET = 0x0234;
// MAX_PARTY_COUNT caps reasonable team sizes for layout heuristics.
const MAX_PARTY_COUNT = 6;

// isReasonablePartyCount checks whether one raw team-size byte could represent a real in-game party count.
const isReasonablePartyCount = (partyCount: number): boolean => {
    return partyCount >= 0 && partyCount <= MAX_PARTY_COUNT;
};

// createDetectionDebugResult combines raw marker values with a human-readable reason for logging and returns.
const createDetectionDebugResult = (
    detectionDebugPayload: DetectionDebugPayload,
    detectionReason: string
): DetectGen3GameResult["debug"] => {
    return {
        trainerSectionWordAt00AC: detectionDebugPayload.trainerSectionWordAt00AC,
        emeraldSecurityKeyCopy: detectionDebugPayload.emeraldSecurityKeyCopy,
        fireRedLeafGreenSecurityKeyCopy: detectionDebugPayload.fireRedLeafGreenSecurityKeyCopy,
        partyCountAtFireRedLeafGreenOffset:
            detectionDebugPayload.partyCountAtFireRedLeafGreenOffset,
        partyCountAtEmeraldOffset: detectionDebugPayload.partyCountAtEmeraldOffset,
        detectionReason
    };
};

// detectGen3Game picks the parsing layout first, then exposes a specific title only when the save proves it.
export const detectGen3Game = (
    sectionsById: Map<number, Gen3SaveSection>
): DetectGen3GameResult => {
    const trainerSection = sectionsById.get(TRAINER_INFO_SECTION_ID);
    const sectionOne = sectionsById.get(SECTION_ONE_ID);

    if (!trainerSection || !sectionOne) {
        throw new Error("Missing Gen 3 sections required for game detection");
    }

    // trainerSectionWordAt00AC is FRLG's fixed game code field and Emerald's primary security key field.
    const trainerSectionWordAt00AC = trainerSection.data.readUInt32LE(SHARED_MARKER_OFFSET);
    // emeraldSecurityKeyCopy mirrors Emerald's security key and helps confirm Emerald layout.
    const emeraldSecurityKeyCopy = trainerSection.data.readUInt32LE(
        EMERALD_SECURITY_KEY_COPY_OFFSET
    );
    // fireRedLeafGreenSecurityKeyCopy mirrors the FRLG security key and helps with debug output.
    const fireRedLeafGreenSecurityKeyCopy = trainerSection.data.readUInt32LE(
        FIRE_RED_LEAF_GREEN_SECURITY_KEY_COPY_OFFSET
    );
    // partyCountAtFireRedLeafGreenOffset reads the FRLG team-size byte for layout detection.
    const partyCountAtFireRedLeafGreenOffset = sectionOne.data.readUInt8(
        FIRE_RED_LEAF_GREEN_PARTY_COUNT_OFFSET
    );
    // partyCountAtEmeraldOffset reads the Emerald team-size byte for layout detection.
    const partyCountAtEmeraldOffset = sectionOne.data.readUInt8(
        EMERALD_PARTY_COUNT_OFFSET
    );
    // detectionDebugPayload captures the raw marker and party-count values for layout debugging.
    const detectionDebugPayload = {
        trainerSectionWordAt00AC,
        emeraldSecurityKeyCopy,
        fireRedLeafGreenSecurityKeyCopy,
        partyCountAtFireRedLeafGreenOffset,
        partyCountAtEmeraldOffset
    };

    if (trainerSectionWordAt00AC === 1) {
        const debugResult = createDetectionDebugResult(
            detectionDebugPayload,
            "Section 0 offset 0x00AC matched the FRLG game code marker"
        );

        console.log("detectGen3Game FRLG marker match", {
            debug: debugResult
        });

        return {
            detectedGame: null,
            layout: "FRLG",
            debug: debugResult
        };
    }

    if (
        trainerSectionWordAt00AC === emeraldSecurityKeyCopy &&
        isReasonablePartyCount(partyCountAtEmeraldOffset)
    ) {
        const debugResult = createDetectionDebugResult(
            detectionDebugPayload,
            "Section 0 security key matched Emerald's known copy location"
        );

        console.log("detectGen3Game Emerald marker match", {
            debug: debugResult
        });

        return {
            detectedGame: "EMERALD",
            layout: "EMERALD",
            debug: debugResult
        };
    }

    if (isReasonablePartyCount(partyCountAtFireRedLeafGreenOffset)) {
        const debugResult = createDetectionDebugResult(
            detectionDebugPayload,
            "Fell back to FRLG layout because the section 1 party count matched FRLG offsets"
        );

        console.log("detectGen3Game FRLG fallback", {
            debug: debugResult
        });

        return {
            detectedGame: null,
            layout: "FRLG",
            debug: debugResult
        };
    }

    const debugResult = createDetectionDebugResult(
        detectionDebugPayload,
        "No FRLG or Emerald heuristic matched the active save sections"
    );

    console.log("detectGen3Game unsupported layout", {
        debug: debugResult
    });

    throw new Error("Unsupported Gen 3 save layout: could not classify as FRLG or Emerald");
};
