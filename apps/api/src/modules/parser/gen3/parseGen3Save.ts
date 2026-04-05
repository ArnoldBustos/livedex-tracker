import {
    detectGen3Game,
    type DetectedGen3Game,
    type Gen3Layout
} from "./detectGen3Game";
import { extractBoxPokemon } from "./extractBoxPokemon";
import {
    extractPartyPokemon,
    type ParsedGen3Pokemon
} from "./extractPartyPokemon";
import {
    extractPokedexFlags,
    type ExtractedPokedexFlags
} from "./extractPokedexFlags";
import {
    extractTrainerInfo,
    type ExtractedTrainerInfo
} from "./extractTrainerInfo";
import { normalizeGen3SaveBuffer } from "./normalizeGen3SaveBuffer";
import { readGen3SaveSections } from "./readGen3SaveSections";

// OptionalGen3ExtractionResult stores one best-effort parser step so minimally valid saves can still upload.
type OptionalGen3ExtractionResult<T> = {
    value: T;
    error: string | null;
};

export type ParsedGen3Save = {
    detectedGame: DetectedGen3Game;
    detectedLayout: Gen3Layout;
    trainerInfo: ExtractedTrainerInfo;
    partyPokemon: ParsedGen3Pokemon[];
    boxPokemon: ParsedGen3Pokemon[];
    pokedexFlags: ExtractedPokedexFlags;
    debug: {
        activeSaveIndex: number;
        sectionIds: number[];
        trainerName: string;
        trainerGender: "male" | "female" | "unknown";
        hasNationalDex: boolean;
        seenNationalDexNumbers: number[];
        caughtNationalDexNumbers: number[];
        seenCount: number;
        caughtCount: number;
        partyCount: number;
        partySpeciesIds: number[];
        boxCount: number;
        boxSpeciesIds: number[];
        livingNationalDexNumbers: number[];
        livingCount: number;
        detectedLayout: Gen3Layout;
        detectedGameReason: string;
        pokedexError: string | null;
        partyError: string | null;
        boxError: string | null;
    };
};

// extractOptionalGen3Data runs one non-critical parser step and falls back when Ruby/Sapphire support is incomplete.
const extractOptionalGen3Data = <T>({
    label,
    extractValue,
    fallbackValue
}: {
    // label identifies the optional parser step in logs and debug payloads.
    label: string;
    // extractValue executes the actual parser step while preserving the original thrown error.
    extractValue: () => T;
    // fallbackValue keeps the upload parse alive when the optional step is not supported yet.
    fallbackValue: T;
}): OptionalGen3ExtractionResult<T> => {
    try {
        return {
            value: extractValue(),
            error: null
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.warn(`parseGen3Save optional ${label} extraction failed`, {
            error: errorMessage
        });

        return {
            value: fallbackValue,
            error: errorMessage
        };
    }
};

// parseGen3Save reads the active save slot, detects the correct Gen 3 layout, and extracts dashboard data.
export const parseGen3Save = (fileBuffer: Buffer): ParsedGen3Save => {
    console.log("parseGen3Save entered");

    // Normalize raw Gen 3 save bytes before section parsing so padded emulator saves work.
    const normalizedFileBuffer = normalizeGen3SaveBuffer(fileBuffer);

    const { activeSaveIndex, sectionsById } = readGen3SaveSections(normalizedFileBuffer);
    const detectedGameResult = detectGen3Game(sectionsById);

    console.log("parseGen3Save after readGen3SaveSections", {
        activeSaveIndex,
        sectionCount: sectionsById.size,
        detectedGame: detectedGameResult.detectedGame,
        detectedLayout: detectedGameResult.layout
    });

    const trainerInfo = extractTrainerInfo({
        sectionsById
    });

    // emptyPokedexFlags preserves a valid parse result when one layout does not expose supported dex offsets yet.
    const emptyPokedexFlags: ExtractedPokedexFlags = {
        seenNationalDexNumbers: [],
        ownedNationalDexNumbers: [],
        hasNationalDex: false
    };

    const pokedexExtractionResult = extractOptionalGen3Data({
        label: "pokedex",
        extractValue: () => {
            return extractPokedexFlags({
                layout: detectedGameResult.layout,
                sectionsById
            });
        },
        fallbackValue: emptyPokedexFlags
    });
    const pokedexFlags = pokedexExtractionResult.value;

    const partyExtractionResult = extractOptionalGen3Data({
        label: "party",
        extractValue: () => {
            return extractPartyPokemon({
                layout: detectedGameResult.layout,
                sectionsById
            });
        },
        fallbackValue: []
    });
    const partyPokemon = partyExtractionResult.value;

    const boxExtractionResult = extractOptionalGen3Data({
        label: "box",
        extractValue: () => {
            return extractBoxPokemon({
                sectionsById
            });
        },
        fallbackValue: []
    });
    const boxPokemon = boxExtractionResult.value;

    const livingNationalDexNumbers = Array.from(
        new Set(
            [...partyPokemon, ...boxPokemon]
                .map((pokemon) => {
                    return pokemon.speciesId;
                })
                .filter((speciesId) => {
                    return speciesId > 0 && speciesId <= 386;
                })
        )
    ).sort((leftDexNumber, rightDexNumber) => {
        return leftDexNumber - rightDexNumber;
    });

    const sectionIds = Array.from(sectionsById.keys()).sort((leftSectionId, rightSectionId) => {
        return leftSectionId - rightSectionId;
    });

    console.log("parseGen3Save trainer debug", {
        trainerName: trainerInfo.name,
        trainerGender: trainerInfo.gender,
        hasNationalDex: pokedexFlags.hasNationalDex,
        livingNationalDexNumbers,
        detectedGame: detectedGameResult.detectedGame,
        detectedLayout: detectedGameResult.layout,
        detectedGameReason: detectedGameResult.debug.detectionReason,
        pokedexError: pokedexExtractionResult.error,
        partyError: partyExtractionResult.error,
        boxError: boxExtractionResult.error
    });

    return {
        detectedGame: detectedGameResult.detectedGame,
        detectedLayout: detectedGameResult.layout,
        trainerInfo,
        partyPokemon,
        boxPokemon,
        pokedexFlags,
        debug: {
            activeSaveIndex,
            sectionIds,
            trainerName: trainerInfo.name,
            trainerGender: trainerInfo.gender,
            hasNationalDex: pokedexFlags.hasNationalDex,
            seenNationalDexNumbers: pokedexFlags.seenNationalDexNumbers,
            caughtNationalDexNumbers: pokedexFlags.ownedNationalDexNumbers,
            seenCount: pokedexFlags.seenNationalDexNumbers.length,
            caughtCount: pokedexFlags.ownedNationalDexNumbers.length,
            partyCount: partyPokemon.length,
            partySpeciesIds: partyPokemon.map((pokemon) => {
                return pokemon.speciesId;
            }),
            boxCount: boxPokemon.length,
            boxSpeciesIds: boxPokemon.slice(0, 30).map((pokemon) => {
                return pokemon.speciesId;
            }),
            livingNationalDexNumbers,
            livingCount: livingNationalDexNumbers.length,
            detectedLayout: detectedGameResult.layout,
            detectedGameReason: detectedGameResult.debug.detectionReason,
            pokedexError: pokedexExtractionResult.error,
            partyError: partyExtractionResult.error,
            boxError: boxExtractionResult.error
        }
    };
};
