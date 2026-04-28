import { pokemonSpeciesIntroducedGen1SeedData } from "./pokemonSpeciesIntroducedGen1";
import { pokemonSpeciesIntroducedGen2SeedData } from "./pokemonSpeciesIntroducedGen2";
import { pokemonSpeciesIntroducedGen3SeedData } from "./pokemonSpeciesIntroducedGen3";
import { pokemonSpeciesIntroducedGen4SeedData } from "./pokemonSpeciesIntroducedGen4";
import type { PokemonSpeciesSeed } from "./pokemonSpecies";

// pokemonSpeciesSeedData assembles the full canonical species seed used by Prisma upserts and dex responses.
// pokemonSpecies.ts re-exports this catalog so existing imports keep working while generation modules stay modular.
export const pokemonSpeciesSeedData: PokemonSpeciesSeed[] = pokemonSpeciesIntroducedGen1SeedData
    .concat(pokemonSpeciesIntroducedGen2SeedData)
    .concat(pokemonSpeciesIntroducedGen3SeedData)
    .concat(pokemonSpeciesIntroducedGen4SeedData);
