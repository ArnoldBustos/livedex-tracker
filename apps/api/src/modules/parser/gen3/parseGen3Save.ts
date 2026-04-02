import {
    extractPokedexFlags,
    type ExtractedPokedexFlags
} from "./extractPokedexFlags";
import { readGen3SaveSections } from "./readGen3SaveSections";

export type ParsedGen3Save = {
    detectedGame: "LEAFGREEN";
    partyPokemon: unknown[];
    boxPokemon: unknown[];
    pokedexFlags: ExtractedPokedexFlags;
    debug: {
        activeSaveIndex: number;
        sectionIds: number[];
        seenNationalDexNumbers: number[];
        ownedNationalDexNumbers: number[];
        seenCount: number;
        ownedCount: number;
    };
};

export const parseGen3Save = (fileBuffer: Buffer): ParsedGen3Save => {
    console.log("parseGen3Save entered");

    const { activeSaveIndex, sectionsById } = readGen3SaveSections(fileBuffer);

    console.log("parseGen3Save after readGen3SaveSections", {
        activeSaveIndex,
        sectionCount: sectionsById.size
    });

    const pokedexFlags = extractPokedexFlags({
        activeSaveIndex,
        sectionsById
    });

    console.log("parseGen3Save after extractPokedexFlags", pokedexFlags);

    const sectionIds = Array.from(sectionsById.keys()).sort((leftSectionId, rightSectionId) => {
        return leftSectionId - rightSectionId;
    });

    return {
        detectedGame: "LEAFGREEN",
        partyPokemon: [],
        boxPokemon: [],
        pokedexFlags,
        debug: {
            activeSaveIndex,
            sectionIds,
            seenNationalDexNumbers: pokedexFlags.seenNationalDexNumbers,
            ownedNationalDexNumbers: pokedexFlags.ownedNationalDexNumbers,
            seenCount: pokedexFlags.seenNationalDexNumbers.length,
            ownedCount: pokedexFlags.ownedNationalDexNumbers.length
        }
    };
};