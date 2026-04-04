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
    detectedGame: "FIRERED" | "LEAFGREEN";
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
    };
};

export const parseGen3Save = (fileBuffer: Buffer): ParsedGen3Save => {
    console.log("parseGen3Save entered");

    const { activeSaveIndex, sectionsById } = readGen3SaveSections(fileBuffer);

    console.log("parseGen3Save after readGen3SaveSections", {
        activeSaveIndex,
        sectionCount: sectionsById.size
    });

    const trainerInfo = extractTrainerInfo({
        sectionsById
    });

    const pokedexFlags = extractPokedexFlags({
        sectionsById
    });

    const partyPokemon = extractPartyPokemon({
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
        livingNationalDexNumbers
    });

    return {
        detectedGame: "FIRERED",
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
            livingCount: livingNationalDexNumbers.length
        }
    };
};