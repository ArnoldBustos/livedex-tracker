import {
    detectGen3Game,
    type DetectedGen3Game
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
import { readGen3SaveSections } from "./readGen3SaveSections";

export type ParsedGen3Save = {
    detectedGame: DetectedGen3Game;
    trainerInfo: ExtractedTrainerInfo;
    partyPokemon: ParsedGen3Pokemon[];
    boxPokemon: ParsedGen3Pokemon[];
    pokedexFlags: ExtractedPokedexFlags;
    debug: {
        activeSaveIndex: number;
        sectionIds: number[];
        trainerName: string;
        trainerGender: "male" | "female" | "unknown";
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
        detectedLayout: "EMERALD" | "FRLG";
        detectedGameReason: string;
    };
};

// parseGen3Save reads the active save slot, detects the correct Gen 3 layout, and extracts dashboard data.
export const parseGen3Save = (fileBuffer: Buffer): ParsedGen3Save => {
    console.log("parseGen3Save entered");

    const { activeSaveIndex, sectionsById } = readGen3SaveSections(fileBuffer);
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

    const pokedexFlags = extractPokedexFlags({
        layout: detectedGameResult.layout,
        sectionsById
    });

    const partyPokemon = extractPartyPokemon({
        layout: detectedGameResult.layout,
        sectionsById
    });

    const boxPokemon = extractBoxPokemon({
        sectionsById
    });

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
        livingNationalDexNumbers,
        detectedGame: detectedGameResult.detectedGame,
        detectedLayout: detectedGameResult.layout,
        detectedGameReason: detectedGameResult.debug.detectionReason
    });

    return {
        detectedGame: detectedGameResult.detectedGame,
        trainerInfo,
        partyPokemon,
        boxPokemon,
        pokedexFlags,
        debug: {
            activeSaveIndex,
            sectionIds,
            trainerName: trainerInfo.name,
            trainerGender: trainerInfo.gender,
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
            detectedGameReason: detectedGameResult.debug.detectionReason
        }
    };
};
