import prismaClient from "../../lib/prisma";
import type { ImportedDexSnapshot } from "../parser/gen3/buildImportedDexSnapshot";

type SyncSaveProfileDexFromParseParams = {
    saveProfileId: string;
    importedDexSnapshot: ImportedDexSnapshot;
};

type SaveProfileDexOverridePatch = {
    standard?: {
        seen?: boolean | null;
        caught?: boolean | null;
        hasLivingEntry?: boolean | null;
    };
    shiny?: {
        seen?: boolean | null;
        caught?: boolean | null;
        hasLivingEntry?: boolean | null;
    };
};

type UpdateSaveProfileDexOverrideParams = {
    userId: string;
    saveProfileId: string;
    pokemonSpeciesId: number;
    overridePatch: SaveProfileDexOverridePatch;
};

type DexState = {
    seen: boolean;
    caught: boolean;
    hasLivingEntry: boolean;
};

type DexOverrideState = {
    seen: boolean | null;
    caught: boolean | null;
    hasLivingEntry: boolean | null;
};

type LayeredDexOverrideState = {
    standard: DexOverrideState;
    shiny: DexOverrideState;
};

type LayeredDexState = {
    standard: DexState;
    shiny: DexState;
};

type DexOwnershipState = {
    totalOwnedCount: number;
    shinyOwnedCount: number;
};

type ImportedDexEntryState = DexState & {
    shinySeen: boolean;
    shinyCaught: boolean;
    shinyLiving: boolean;
    totalOwnedCount: number;
    shinyOwnedCount: number;
};

type DexSpeciesRecord = {
    id: number;
    dexNumber: number;
    name: string;
    generation: number;
    primaryType: string;
    secondaryType: string | null;
};

// getEmptyDexState creates one false-initialized collection state.
// layered dex helpers use this so blank standard and shiny layers share the same base shape.
const getEmptyDexState = (): DexState => {
    return {
        seen: false,
        caught: false,
        hasLivingEntry: false
    };
};

// buildCollectionState creates one collection layer for a dex entry response.
// getEmptyDex, getSaveProfileDex, and upload response builders use this so standard and shiny stay structurally aligned.
const buildCollectionState = ({
    seen,
    caught,
    hasLivingEntry
}: DexState) => {
    return {
        seen,
        caught,
        hasLivingEntry
    };
};

// buildLayeredCollectionState converts one layered dex state into the response entry collection shape.
// getEmptyDex and getSaveProfileDex use this so standard and shiny entry fields stay assembled in one place.
const buildLayeredCollectionState = (layeredState: LayeredDexState) => {
    return {
        standard: buildCollectionState(layeredState.standard),
        shiny: buildCollectionState(layeredState.shiny)
    };
};

// buildDefaultOwnershipState creates zeroed ownership counters for one dex entry response.
// getEmptyDex and getSaveProfileDex use this so ownership fields exist before ownership behavior is added.
const buildDefaultOwnershipState = (): DexOwnershipState => {
    return {
        totalOwnedCount: 0,
        shinyOwnedCount: 0
    };
};

// getResolvedOwnershipState projects visible owned counters from imported ownership and resolved collection state.
// getSaveProfileDex uses this so sidebar ownership counts stay aligned with manual standard and shiny overrides.
const getResolvedOwnershipState = ({
    importedOwnershipState,
    resolvedLayeredState
}: {
    importedOwnershipState?: DexOwnershipState;
    resolvedLayeredState: LayeredDexState;
}): DexOwnershipState => {
    const importedTotalOwnedCount = importedOwnershipState ? importedOwnershipState.totalOwnedCount : 0;
    const importedShinyOwnedCount = importedOwnershipState ? importedOwnershipState.shinyOwnedCount : 0;
    const hasResolvedStandardOwnership =
        resolvedLayeredState.standard.caught || resolvedLayeredState.standard.hasLivingEntry;
    const hasResolvedShinyOwnership =
        resolvedLayeredState.shiny.caught || resolvedLayeredState.shiny.hasLivingEntry;
    const resolvedShinyOwnedCount = hasResolvedShinyOwnership
        ? Math.max(importedShinyOwnedCount, 1)
        : 0;
    const resolvedStandardOwnedCount = hasResolvedStandardOwnership
        ? Math.max(importedTotalOwnedCount, 1)
        : 0;

    return {
        totalOwnedCount: Math.max(resolvedStandardOwnedCount, resolvedShinyOwnedCount),
        shinyOwnedCount: resolvedShinyOwnedCount
    };
};

// buildLayeredDexSummary creates the layered summary payload from separated collection and ownership layers.
// getEmptyDex and getSaveProfileDex use this so summary generation matches the imported snapshot model.
const buildLayeredDexSummary = (layeredEntries: Array<{
    collectionState: LayeredDexState;
    ownershipState: DexOwnershipState;
}>) => {
    const standardEntries = layeredEntries.map((entry) => {
        return entry.collectionState.standard;
    });
    const shinyEntries = layeredEntries.map((entry) => {
        return entry.collectionState.shiny;
    });

    return {
        standard: buildDexSummary(standardEntries),
        shiny: buildDexSummary(shinyEntries),
        ownership: {
            totalOwnedCount: layeredEntries.reduce((currentTotal, entry) => {
                return currentTotal + entry.ownershipState.totalOwnedCount;
            }, 0),
            totalShinyOwnedCount: layeredEntries.reduce((currentTotal, entry) => {
                return currentTotal + entry.ownershipState.shinyOwnedCount;
            }, 0)
        }
    };
};

// normalizeDexLayerState enforces the manual toggle rules for one resolved collection layer.
// updateSaveProfileDexOverride uses this so signed-in standard and shiny writes follow the same living -> caught -> seen -> missing tier transitions as the dashboard.
const normalizeDexLayerState = ({
    layerState,
    overridePatch
}: {
    layerState: DexState;
    overridePatch?: SaveProfileDexOverridePatch["standard"];
}): DexState => {
    const nextLayerState = {
        seen: layerState.seen,
        caught: layerState.caught,
        hasLivingEntry: layerState.hasLivingEntry
    };

    if (overridePatch && typeof overridePatch.seen === "boolean") {
        nextLayerState.seen = overridePatch.seen;
    }

    if (overridePatch && typeof overridePatch.caught === "boolean") {
        nextLayerState.caught = overridePatch.caught;
    }

    if (overridePatch && typeof overridePatch.hasLivingEntry === "boolean") {
        nextLayerState.hasLivingEntry = overridePatch.hasLivingEntry;
    }

    if (overridePatch && overridePatch.seen === false) {
        nextLayerState.caught = false;
        nextLayerState.hasLivingEntry = false;
    }

    if (overridePatch && overridePatch.caught === false) {
        nextLayerState.hasLivingEntry = false;
    }

    if (nextLayerState.hasLivingEntry) {
        nextLayerState.caught = true;
        nextLayerState.seen = true;
    }

    if (nextLayerState.caught) {
        nextLayerState.seen = true;
    }

    return nextLayerState;
};

// getOverrideFieldValue converts one resolved boolean back into a nullable override field.
// getLayeredOverrideState uses this so stored override rows only keep values that differ from imported dex state.
const getOverrideFieldValue = ({
    importedValue,
    nextValue
}: {
    importedValue: boolean;
    nextValue: boolean;
}) => {
    return importedValue === nextValue ? null : nextValue;
};

// getLayeredOverrideState builds the next normalized standard and shiny override rows from one layered patch.
// updateSaveProfileDexOverride uses this so both collection layers stay modular and store only deltas from imported state.
const getLayeredOverrideState = ({
    overridePatch,
    currentLayeredState,
    importedState
}: {
    overridePatch: SaveProfileDexOverridePatch;
    currentLayeredState: LayeredDexState;
    importedState?: ImportedDexEntryState;
}): LayeredDexOverrideState => {
    // getImportedLayerState reads one layer's imported booleans so override storage can stay minimal.
    // getLayeredOverrideState uses this to null out fields that match the underlying imported dex state.
    const getImportedLayerState = (layerKey: "standard" | "shiny"): DexState => {
        if (layerKey === "standard") {
            return {
                seen: importedState ? importedState.seen : false,
                caught: importedState ? importedState.caught : false,
                hasLivingEntry: importedState ? importedState.hasLivingEntry : false
            };
        }

        return {
            seen: importedState ? importedState.shinySeen : false,
            caught: importedState ? importedState.shinyCaught : false,
            hasLivingEntry: importedState ? importedState.shinyLiving : false
        };
    };

    // getNextLayerOverrideState normalizes one visible layer and reduces it back to imported-relative override fields.
    // getLayeredOverrideState uses this so standard and shiny persistence stay structurally parallel.
    const getNextLayerOverrideState = (layerKey: "standard" | "shiny"): DexOverrideState => {
        const layerPatch = overridePatch[layerKey];
        const importedLayerState = getImportedLayerState(layerKey);
        const currentLayerState = currentLayeredState[layerKey];
        const nextLayerState = normalizeDexLayerState({
            layerState: currentLayerState,
            overridePatch: layerPatch
        });

        return {
            seen: getOverrideFieldValue({
                importedValue: importedLayerState.seen,
                nextValue: nextLayerState.seen
            }),
            caught: getOverrideFieldValue({
                importedValue: importedLayerState.caught,
                nextValue: nextLayerState.caught
            }),
            hasLivingEntry: getOverrideFieldValue({
                importedValue: importedLayerState.hasLivingEntry,
                nextValue: nextLayerState.hasLivingEntry
            })
        };
    };

    return {
        standard: getNextLayerOverrideState("standard"),
        shiny: getNextLayerOverrideState("shiny")
    };
};

// syncSaveProfileDexFromParse stores the imported save snapshot for one profile.
// uploads.service.ts calls this after parser output is available for a completed upload.
export const syncSaveProfileDexFromParse = async ({
    saveProfileId,
    importedDexSnapshot
}: SyncSaveProfileDexFromParseParams) => {
    console.log("syncSaveProfileDexFromParse input", {
        saveProfileId,
        importedDexSnapshotEntryCount: importedDexSnapshot.entries.length,
        importedOwnershipTotal: importedDexSnapshot.summary.ownership.totalOwnedCount,
        importedShinyOwnershipTotal: importedDexSnapshot.summary.ownership.totalShinyOwnedCount
    });
    const importedSnapshotByDexNumber = new Map(
        importedDexSnapshot.entries.map((entry) => {
            return [entry.dexNumber, entry];
        })
    );

    const matchingSpecies = await prismaClient.pokemonSpecies.findMany({
        select: {
            id: true,
            dexNumber: true
        }
    });

    for (const pokemonSpecies of matchingSpecies) {
        const importedSnapshotEntry = importedSnapshotByDexNumber.get(pokemonSpecies.dexNumber);
        const standardState = importedSnapshotEntry
            ? importedSnapshotEntry.standard
            : getEmptyDexState();
        const shinyState = importedSnapshotEntry
            ? importedSnapshotEntry.shiny
            : getEmptyDexState();
        const ownershipState = importedSnapshotEntry
            ? importedSnapshotEntry.ownership
            : buildDefaultOwnershipState();

        await prismaClient.saveProfileDexEntry.upsert({
            where: {
                saveProfileId_pokemonSpeciesId: {
                    saveProfileId,
                    pokemonSpeciesId: pokemonSpecies.id
                }
            },
            update: {
                seen: standardState.seen,
                caught: standardState.caught,
                hasLivingEntry: standardState.hasLivingEntry,
                shinySeen: shinyState.seen,
                shinyCaught: shinyState.caught,
                shinyLiving: shinyState.hasLivingEntry,
                totalOwnedCount: ownershipState.totalOwnedCount,
                shinyOwnedCount: ownershipState.shinyOwnedCount
            },
            create: {
                saveProfileId,
                pokemonSpeciesId: pokemonSpecies.id,
                seen: standardState.seen,
                caught: standardState.caught,
                hasLivingEntry: standardState.hasLivingEntry,
                shinySeen: shinyState.seen,
                shinyCaught: shinyState.caught,
                shinyLiving: shinyState.hasLivingEntry,
                totalOwnedCount: ownershipState.totalOwnedCount,
                shinyOwnedCount: ownershipState.shinyOwnedCount
            }
        });
    }

    return {
        updatedCount: matchingSpecies.length
    };
};

// resolveOverrideValue applies a manual override when one exists for a field.
// getResolvedDexEntryState uses this so imported save data remains the base snapshot.
const resolveOverrideValue = (
    importedValue: boolean,
    overrideValue: boolean | null | undefined
) => {
    if (typeof overrideValue === "boolean") {
        return overrideValue;
    }

    return importedValue;
};

// buildDexSummary counts resolved dex flags for the frontend summary payload.
// getSaveProfileDex uses this after imported and manual states are merged.
const buildDexSummary = (entries: DexState[]) => {
    const seenCount = entries.filter((dexEntry) => {
        return dexEntry.seen;
    }).length;

    const caughtCount = entries.filter((dexEntry) => {
        return dexEntry.caught;
    }).length;

    const livingCount = entries.filter((dexEntry) => {
        return dexEntry.hasLivingEntry;
    }).length;

    return {
        totalEntries: entries.length,
        seenCount,
        caughtCount,
        livingCount
    };
};

// getDexSpeciesRecords loads the canonical species rows used for both empty and resolved dex payloads.
// getEmptyDex and getSaveProfileDex call this so the frontend always receives one consistent species ordering.
const getDexSpeciesRecords = async (): Promise<DexSpeciesRecord[]> => {
    return await prismaClient.pokemonSpecies.findMany({
        select: {
            id: true,
            dexNumber: true,
            name: true,
            generation: true,
            primaryType: true,
            secondaryType: true
        },
        orderBy: {
            dexNumber: "asc"
        }
    });
};

// getEmptyDex returns the blank dex template with every species initialized to false.
// manual entry setup uses this so local shells render through the same dashboard path as uploads.
export const getEmptyDex = async () => {
    const pokemonSpecies = await getDexSpeciesRecords();

    const layeredEntries = pokemonSpecies.map((species) => {
        return {
            species,
            collectionState: {
                standard: getEmptyDexState(),
                shiny: getEmptyDexState()
            },
            ownershipState: buildDefaultOwnershipState()
        };
    });

    const entries = layeredEntries.map((layeredEntry) => {
        const layeredCollectionState = buildLayeredCollectionState(layeredEntry.collectionState);

        return {
            pokemonSpeciesId: layeredEntry.species.id,
            dexNumber: layeredEntry.species.dexNumber,
            name: layeredEntry.species.name,
            generation: layeredEntry.species.generation,
            primaryType: layeredEntry.species.primaryType,
            secondaryType: layeredEntry.species.secondaryType,
            standard: layeredCollectionState.standard,
            shiny: layeredCollectionState.shiny,
            ownership: buildDefaultOwnershipState()
        };
    });

    return {
        summary: buildLayeredDexSummary(layeredEntries),
        entries
    };
};

// getImportedDexEntryMap loads imported dex snapshot rows keyed by species id.
// getSaveProfileDex uses this as the base state before manual overrides are applied.
const getImportedDexEntryMap = async (saveProfileId: string) => {
    const dexEntries = await prismaClient.saveProfileDexEntry.findMany({
        where: {
            saveProfileId
        },
        select: {
            pokemonSpeciesId: true,
            seen: true,
            caught: true,
            hasLivingEntry: true,
            shinySeen: true,
            shinyCaught: true,
            shinyLiving: true,
            totalOwnedCount: true,
            shinyOwnedCount: true
        }
    });

    return new Map(
        dexEntries.map((dexEntry) => {
            return [dexEntry.pokemonSpeciesId, dexEntry];
        })
    );
};

// getOverrideDexEntryMap loads manual override rows keyed by species id.
// getSaveProfileDex uses this to let manual edits win over imported save state.
const getOverrideDexEntryMap = async (saveProfileId: string) => {
    const dexOverrides = await prismaClient.saveProfileDexOverride.findMany({
        where: {
            saveProfileId
        },
        select: {
            pokemonSpeciesId: true,
            seen: true,
            caught: true,
            hasLivingEntry: true,
            shinySeen: true,
            shinyCaught: true,
            shinyLiving: true
        }
    });

    return new Map(
        dexOverrides.map((dexOverride) => {
            return [dexOverride.pokemonSpeciesId, dexOverride];
        })
    );
};

// getResolvedDexEntryState merges imported snapshot state with one manual override row.
// getSaveProfileDex uses this to return the final frontend-visible standard and shiny layer values.
const getResolvedLayeredDexEntryState = ({
    importedState,
    overrideState
}: {
    importedState?: ImportedDexEntryState;
    overrideState?: {
        seen: boolean | null;
        caught: boolean | null;
        hasLivingEntry: boolean | null;
        shinySeen: boolean | null;
        shinyCaught: boolean | null;
        shinyLiving: boolean | null;
    };
}): LayeredDexState => {
    const baseState: DexState = {
        seen: importedState ? importedState.seen : false,
        caught: importedState ? importedState.caught : false,
        hasLivingEntry: importedState ? importedState.hasLivingEntry : false
    };
    const shinyState: DexState = {
        seen: importedState && "shinySeen" in importedState ? importedState.shinySeen : false,
        caught: importedState && "shinyCaught" in importedState ? importedState.shinyCaught : false,
        hasLivingEntry: importedState && "shinyLiving" in importedState ? importedState.shinyLiving : false
    };

    return {
        standard: {
            seen: resolveOverrideValue(baseState.seen, overrideState ? overrideState.seen : undefined),
            caught: resolveOverrideValue(baseState.caught, overrideState ? overrideState.caught : undefined),
            hasLivingEntry: resolveOverrideValue(
                baseState.hasLivingEntry,
                overrideState ? overrideState.hasLivingEntry : undefined
            )
        },
        shiny: {
            seen: resolveOverrideValue(shinyState.seen, overrideState ? overrideState.shinySeen : undefined),
            caught: resolveOverrideValue(shinyState.caught, overrideState ? overrideState.shinyCaught : undefined),
            hasLivingEntry: resolveOverrideValue(
                shinyState.hasLivingEntry,
                overrideState ? overrideState.shinyLiving : undefined
            )
        }
    };
};

// assertOwnedSaveProfile ensures the current user owns the requested save profile.
// dex writes call this before mutating override state in Postgres.
const assertOwnedSaveProfile = async (userId: string, saveProfileId: string) => {
    const saveProfile = await prismaClient.saveProfile.findFirst({
        where: {
            id: saveProfileId,
            userId
        },
        select: {
            id: true
        }
    });

    if (!saveProfile) {
        throw new Error("Save profile not found");
    }
};

// assertExistingPokemonSpecies ensures a manual override only targets seeded species rows.
// dex writes call this before creating or updating an override row.
const assertExistingPokemonSpecies = async (pokemonSpeciesId: number) => {
    const pokemonSpecies = await prismaClient.pokemonSpecies.findUnique({
        where: {
            id: pokemonSpeciesId
        },
        select: {
            id: true
        }
    });

    if (!pokemonSpecies) {
        throw new Error("Pokemon species not found");
    }
};

// hasAnyOverrideValue checks whether one override layer still contains at least one persisted field.
// updateSaveProfileDexOverride uses this so null-only standard or shiny layers do not count as stored overrides.
const hasAnyOverrideValue = (overrideState: DexOverrideState) => {
    return (
        typeof overrideState.seen === "boolean" ||
        typeof overrideState.caught === "boolean" ||
        typeof overrideState.hasLivingEntry === "boolean"
    );
};

// hasAnyLayeredOverrideValue checks whether either override layer still contains a persisted field.
// updateSaveProfileDexOverride uses this to delete empty override rows instead of storing null-only standard and shiny state.
const hasAnyLayeredOverrideValue = (layeredOverrideState: LayeredDexOverrideState) => {
    return hasAnyOverrideValue(layeredOverrideState.standard) || hasAnyOverrideValue(layeredOverrideState.shiny);
};

// getSaveProfileDex returns the resolved dex payload for one save profile.
// uploads and dex controllers call this so reads stay centralized in the dex module.
export const getSaveProfileDex = async (saveProfileId: string) => {
    const pokemonSpecies = await getDexSpeciesRecords();

    const importedDexEntryBySpeciesId = await getImportedDexEntryMap(saveProfileId);
    const overrideDexEntryBySpeciesId = await getOverrideDexEntryMap(saveProfileId);

    const layeredEntries = pokemonSpecies.map((species) => {
        const importedDexEntry = importedDexEntryBySpeciesId.get(species.id);
        const resolvedLayeredState = getResolvedLayeredDexEntryState({
            importedState: importedDexEntry,
            overrideState: overrideDexEntryBySpeciesId.get(species.id)
        });
        const resolvedOwnershipState = getResolvedOwnershipState({
            importedOwnershipState: importedDexEntry
                ? {
                    totalOwnedCount: importedDexEntry.totalOwnedCount,
                    shinyOwnedCount: importedDexEntry.shinyOwnedCount
                }
                : undefined,
            resolvedLayeredState
        });

        return {
            species,
            collectionState: resolvedLayeredState,
            ownershipState: resolvedOwnershipState
        };
    });

    const entries = layeredEntries.map((layeredEntry) => {
        const layeredCollectionState = buildLayeredCollectionState(layeredEntry.collectionState);

        return {
            pokemonSpeciesId: layeredEntry.species.id,
            dexNumber: layeredEntry.species.dexNumber,
            name: layeredEntry.species.name,
            generation: layeredEntry.species.generation,
            primaryType: layeredEntry.species.primaryType,
            secondaryType: layeredEntry.species.secondaryType,
            standard: layeredCollectionState.standard,
            shiny: layeredCollectionState.shiny,
            ownership: layeredEntry.ownershipState
        };
    });

    return {
        summary: buildLayeredDexSummary(layeredEntries),
        entries
    };
};

// getOwnedSaveProfileDex returns resolved dex data after an ownership check.
// dex.controller.ts uses this for direct dex reads outside the uploads detail flow.
export const getOwnedSaveProfileDex = async ({
    userId,
    saveProfileId
}: {
    userId: string;
    saveProfileId: string;
}) => {
    await assertOwnedSaveProfile(userId, saveProfileId);

    return await getSaveProfileDex(saveProfileId);
};

// updateSaveProfileDexOverride writes one signed-in manual dex override row for a profile.
// dex.controller.ts calls this for PATCH requests, then returns the refreshed resolved dex payload.
export const updateSaveProfileDexOverride = async ({
    userId,
    saveProfileId,
    pokemonSpeciesId,
    overridePatch
}: UpdateSaveProfileDexOverrideParams) => {
    await assertOwnedSaveProfile(userId, saveProfileId);
    await assertExistingPokemonSpecies(pokemonSpeciesId);

    const importedState = await prismaClient.saveProfileDexEntry.findUnique({
        where: {
            saveProfileId_pokemonSpeciesId: {
                saveProfileId,
                pokemonSpeciesId
            }
        },
        select: {
            seen: true,
            caught: true,
            hasLivingEntry: true,
            shinySeen: true,
            shinyCaught: true,
            shinyLiving: true,
            totalOwnedCount: true,
            shinyOwnedCount: true
        }
    });

    const existingOverride = await prismaClient.saveProfileDexOverride.findUnique({
        where: {
            saveProfileId_pokemonSpeciesId: {
                saveProfileId,
                pokemonSpeciesId
            }
        },
        select: {
            id: true,
            seen: true,
            caught: true,
            hasLivingEntry: true,
            shinySeen: true,
            shinyCaught: true,
            shinyLiving: true
        }
    });

    // currentLayeredState resolves the visible booleans before applying the next patch.
    // updateSaveProfileDexOverride uses this so one click can demote from living to seen or missing without stale override-only baselines.
    const currentLayeredState = getResolvedLayeredDexEntryState({
        importedState: importedState ? importedState : undefined,
        overrideState: existingOverride ? existingOverride : undefined
    });

    const nextLayeredOverrideState = getLayeredOverrideState({
        overridePatch,
        currentLayeredState,
        importedState: importedState ? importedState : undefined
    });

    if (!hasAnyLayeredOverrideValue(nextLayeredOverrideState)) {
        if (existingOverride) {
            await prismaClient.saveProfileDexOverride.delete({
                where: {
                    id: existingOverride.id
                }
            });
        }

        return await getSaveProfileDex(saveProfileId);
    }

    await prismaClient.saveProfileDexOverride.upsert({
        where: {
            saveProfileId_pokemonSpeciesId: {
                saveProfileId,
                pokemonSpeciesId
            }
        },
        update: {
            seen: nextLayeredOverrideState.standard.seen,
            caught: nextLayeredOverrideState.standard.caught,
            hasLivingEntry: nextLayeredOverrideState.standard.hasLivingEntry,
            shinySeen: nextLayeredOverrideState.shiny.seen,
            shinyCaught: nextLayeredOverrideState.shiny.caught,
            shinyLiving: nextLayeredOverrideState.shiny.hasLivingEntry
        },
        create: {
            saveProfileId,
            pokemonSpeciesId,
            seen: nextLayeredOverrideState.standard.seen,
            caught: nextLayeredOverrideState.standard.caught,
            hasLivingEntry: nextLayeredOverrideState.standard.hasLivingEntry,
            shinySeen: nextLayeredOverrideState.shiny.seen,
            shinyCaught: nextLayeredOverrideState.shiny.caught,
            shinyLiving: nextLayeredOverrideState.shiny.hasLivingEntry
        }
    });

    return await getSaveProfileDex(saveProfileId);
};
