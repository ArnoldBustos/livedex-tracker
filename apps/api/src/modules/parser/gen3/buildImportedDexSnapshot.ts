import type { ExtractedPokedexFlags } from "./extractPokedexFlags";
import type { ParsedGen3Pokemon } from "./extractPartyPokemon";

// ImportedDexSnapshotCollectionState stores one imported snapshot layer before API formatting.
// parseGen3Save and upload flows use this so parser aggregation stays separate from dex response DTO shaping.
export type ImportedDexSnapshotCollectionState = {
    seen: boolean;
    caught: boolean;
    hasLivingEntry: boolean;
};

// ImportedDexSnapshotOwnershipState stores imported ownership counters for one species snapshot row.
// parser snapshot consumers use this so ownership counts stay independent from boolean dex flags.
export type ImportedDexSnapshotOwnershipState = {
    totalOwnedCount: number;
    shinyOwnedCount: number;
};

// ImportedDexSnapshotEntry stores one per-species imported snapshot record keyed by National Dex number.
// dex persistence and guest upload response builders use this so parser aggregation stays modular.
export type ImportedDexSnapshotEntry = {
    dexNumber: number;
    standard: ImportedDexSnapshotCollectionState;
    shiny: ImportedDexSnapshotCollectionState;
    ownership: ImportedDexSnapshotOwnershipState;
};

// ImportedDexSnapshotSummary stores the aggregate parser snapshot totals before response formatting.
// parseGen3Save exposes this so uploads and dex services can reuse one parser-owned summary calculation.
export type ImportedDexSnapshotSummary = {
    standard: {
        totalEntries: number;
        seenCount: number;
        caughtCount: number;
        livingCount: number;
    };
    shiny: {
        totalEntries: number;
        seenCount: number;
        caughtCount: number;
        livingCount: number;
    };
    ownership: {
        totalOwnedCount: number;
        totalShinyOwnedCount: number;
    };
};

// ImportedDexSnapshot stores the parser-owned per-species snapshot and aggregate totals.
// upload and dex modules consume this so imported save state is computed once inside the parser layer.
export type ImportedDexSnapshot = {
    entries: ImportedDexSnapshotEntry[];
    summary: ImportedDexSnapshotSummary;
};

// MAX_GEN3_NATIONAL_DEX_NUMBER caps parser snapshot rows to the seeded Gen 3 species range.
const MAX_GEN3_NATIONAL_DEX_NUMBER = 386;

// buildImportedDexSnapshot aggregates parsed save data into a layered per-species imported snapshot.
// parseGen3Save uses this so shiny and ownership counts stay parser-owned instead of being rebuilt downstream.
export const buildImportedDexSnapshot = ({
    pokedexFlags,
    partyPokemon,
    boxPokemon
}: {
    pokedexFlags: ExtractedPokedexFlags;
    partyPokemon: ParsedGen3Pokemon[];
    boxPokemon: ParsedGen3Pokemon[];
}): ImportedDexSnapshot => {
    const seenDexNumberSet = new Set(pokedexFlags.seenNationalDexNumbers);
    const caughtDexNumberSet = new Set(pokedexFlags.ownedNationalDexNumbers);
    const ownedPokemonByDexNumber = new Map<number, ParsedGen3Pokemon[]>();

    for (const pokemon of [...partyPokemon, ...boxPokemon]) {
        if (pokemon.speciesId <= 0 || pokemon.speciesId > MAX_GEN3_NATIONAL_DEX_NUMBER) {
            continue;
        }

        const existingOwnedPokemon = ownedPokemonByDexNumber.get(pokemon.speciesId);

        if (existingOwnedPokemon) {
            existingOwnedPokemon.push(pokemon);
            continue;
        }

        ownedPokemonByDexNumber.set(pokemon.speciesId, [pokemon]);
    }

    const entries: ImportedDexSnapshotEntry[] = [];

    for (let dexNumber = 1; dexNumber <= MAX_GEN3_NATIONAL_DEX_NUMBER; dexNumber += 1) {
        const ownedPokemon = ownedPokemonByDexNumber.get(dexNumber) || [];
        const shinyOwnedCount = ownedPokemon.filter((pokemon) => {
            return pokemon.isShiny;
        }).length;
        const totalOwnedCount = ownedPokemon.length;
        const hasShinyOwnedPokemon = shinyOwnedCount > 0;

        entries.push({
            dexNumber,
            standard: {
                seen: seenDexNumberSet.has(dexNumber),
                caught: caughtDexNumberSet.has(dexNumber),
                hasLivingEntry: totalOwnedCount > 0
            },
            shiny: {
                seen: hasShinyOwnedPokemon,
                caught: hasShinyOwnedPokemon,
                hasLivingEntry: hasShinyOwnedPokemon
            },
            ownership: {
                totalOwnedCount,
                shinyOwnedCount
            }
        });
    }

    return {
        entries,
        summary: {
            standard: {
                totalEntries: entries.length,
                seenCount: entries.filter((entry) => {
                    return entry.standard.seen;
                }).length,
                caughtCount: entries.filter((entry) => {
                    return entry.standard.caught;
                }).length,
                livingCount: entries.filter((entry) => {
                    return entry.standard.hasLivingEntry;
                }).length
            },
            shiny: {
                totalEntries: entries.length,
                seenCount: entries.filter((entry) => {
                    return entry.shiny.seen;
                }).length,
                caughtCount: entries.filter((entry) => {
                    return entry.shiny.caught;
                }).length,
                livingCount: entries.filter((entry) => {
                    return entry.shiny.hasLivingEntry;
                }).length
            },
            ownership: {
                totalOwnedCount: entries.reduce((currentTotal, entry) => {
                    return currentTotal + entry.ownership.totalOwnedCount;
                }, 0),
                totalShinyOwnedCount: entries.reduce((currentTotal, entry) => {
                    return currentTotal + entry.ownership.shinyOwnedCount;
                }, 0)
            }
        }
    };
};
