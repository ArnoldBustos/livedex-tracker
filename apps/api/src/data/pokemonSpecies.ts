// PokemonType stores the canonical elemental types used by seeded species rows and dex responses.
// Introduced-generation seed modules use this union through PokemonSpeciesSeed typing.
export type PokemonType =
    | "NORMAL"
    | "FIRE"
    | "WATER"
    | "ELECTRIC"
    | "GRASS"
    | "ICE"
    | "FIGHTING"
    | "POISON"
    | "GROUND"
    | "FLYING"
    | "PSYCHIC"
    | "BUG"
    | "ROCK"
    | "GHOST"
    | "DRAGON"
    | "DARK"
    | "STEEL";

// PokemonSpeciesSeed stores one canonical species seed row used by Prisma upserts and dex responses.
// All introduced-generation seed modules and pokemonSpeciesCatalog.ts share this shape.
export type PokemonSpeciesSeed = {
    id: number;
    dexNumber: number;
    name: string;
    generation: number;
    primaryType: PokemonType;
    secondaryType: PokemonType | null;
};

// pokemonSpeciesSeedData preserves the long-lived data entrypoint used by the seed script and older imports.
// pokemonSpeciesCatalog.ts now owns the composition so introduced-generation modules stay separate and modular.
export { pokemonSpeciesSeedData } from "./pokemonSpeciesCatalog";
