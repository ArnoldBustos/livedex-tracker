import {
    extractPokedexFlags,
    type ExtractedPokedexFlags
} from "./extractPokedexFlags";

export type ParsedGen3Save = {
    detectedGame: "LEAFGREEN";
    partyPokemon: unknown[];
    boxPokemon: unknown[];
    pokedexFlags: ExtractedPokedexFlags;
};

export const parseGen3Save = (fileBuffer: Buffer): ParsedGen3Save => {
    const pokedexFlags = extractPokedexFlags(fileBuffer);

    console.log("parseGen3Save pokedexFlags", pokedexFlags);

    return {
        detectedGame: "LEAFGREEN",
        partyPokemon: [],
        boxPokemon: [],
        pokedexFlags
    };
};