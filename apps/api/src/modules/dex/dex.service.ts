import prismaClient from "../../lib/prisma";

type SyncSaveProfileDexFromParseParams = {
    saveProfileId: string;
    seenNationalDexNumbers: number[];
    caughtNationalDexNumbers: number[];
    livingNationalDexNumbers: number[];
};

type SaveProfileDexOverridePatch = {
    seen?: boolean | null;
    caught?: boolean | null;
    hasLivingEntry?: boolean | null;
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

type DexSpeciesRecord = {
    id: number;
    dexNumber: number;
    name: string;
    generation: number;
    primaryType: string;
    secondaryType: string | null;
};

// syncSaveProfileDexFromParse stores the imported save snapshot for one profile.
// uploads.service.ts calls this after parser output is available for a completed upload.
export const syncSaveProfileDexFromParse = async ({
    saveProfileId,
    seenNationalDexNumbers,
    caughtNationalDexNumbers,
    livingNationalDexNumbers
}: SyncSaveProfileDexFromParseParams) => {
    console.log("syncSaveProfileDexFromParse input", {
        saveProfileId,
        seenNationalDexNumbers,
        caughtNationalDexNumbers,
        livingNationalDexNumbers
    });

    const allDexNumbers = Array.from(
        new Set([
            ...seenNationalDexNumbers,
            ...caughtNationalDexNumbers,
            ...livingNationalDexNumbers
        ])
    );

    const seenDexNumberSet = new Set(seenNationalDexNumbers);
    const caughtDexNumberSet = new Set(caughtNationalDexNumbers);
    const livingDexNumberSet = new Set(livingNationalDexNumbers);

    if (allDexNumbers.length === 0) {
        await prismaClient.saveProfileDexEntry.updateMany({
            where: {
                saveProfileId,
                OR: [
                    {
                        seen: true
                    },
                    {
                        caught: true
                    },
                    {
                        hasLivingEntry: true
                    }
                ]
            },
            data: {
                seen: false,
                caught: false,
                hasLivingEntry: false
            }
        });

        return {
            updatedCount: 0
        };
    }

    const matchingSpecies = await prismaClient.pokemonSpecies.findMany({
        where: {
            dexNumber: {
                in: allDexNumbers
            }
        },
        select: {
            id: true,
            dexNumber: true
        }
    });

    for (const pokemonSpecies of matchingSpecies) {
        const isSeen = seenDexNumberSet.has(pokemonSpecies.dexNumber);
        const isCaught = caughtDexNumberSet.has(pokemonSpecies.dexNumber);
        const hasLivingEntry = livingDexNumberSet.has(pokemonSpecies.dexNumber);

        await prismaClient.saveProfileDexEntry.upsert({
            where: {
                saveProfileId_pokemonSpeciesId: {
                    saveProfileId,
                    pokemonSpeciesId: pokemonSpecies.id
                }
            },
            update: {
                seen: isSeen,
                caught: isCaught,
                hasLivingEntry
            },
            create: {
                saveProfileId,
                pokemonSpeciesId: pokemonSpecies.id,
                seen: isSeen,
                caught: isCaught,
                hasLivingEntry
            }
        });
    }

    const livingPokemonSpeciesIds = matchingSpecies
        .filter((pokemonSpecies) => {
            return livingDexNumberSet.has(pokemonSpecies.dexNumber);
        })
        .map((pokemonSpecies) => {
            return pokemonSpecies.id;
        });

    const seenPokemonSpeciesIds = matchingSpecies
        .filter((pokemonSpecies) => {
            return seenDexNumberSet.has(pokemonSpecies.dexNumber);
        })
        .map((pokemonSpecies) => {
            return pokemonSpecies.id;
        });

    const caughtPokemonSpeciesIds = matchingSpecies
        .filter((pokemonSpecies) => {
            return caughtDexNumberSet.has(pokemonSpecies.dexNumber);
        })
        .map((pokemonSpecies) => {
            return pokemonSpecies.id;
        });

    await prismaClient.saveProfileDexEntry.updateMany({
        where: {
            saveProfileId,
            seen: true,
            pokemonSpeciesId: {
                notIn: seenPokemonSpeciesIds
            }
        },
        data: {
            seen: false
        }
    });

    await prismaClient.saveProfileDexEntry.updateMany({
        where: {
            saveProfileId,
            caught: true,
            pokemonSpeciesId: {
                notIn: caughtPokemonSpeciesIds
            }
        },
        data: {
            caught: false
        }
    });

    await prismaClient.saveProfileDexEntry.updateMany({
        where: {
            saveProfileId,
            hasLivingEntry: true,
            pokemonSpeciesId: {
                notIn: livingPokemonSpeciesIds
            }
        },
        data: {
            hasLivingEntry: false
        }
    });

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

    const entries = pokemonSpecies.map((species) => {
        return {
            pokemonSpeciesId: species.id,
            dexNumber: species.dexNumber,
            name: species.name,
            generation: species.generation,
            primaryType: species.primaryType,
            secondaryType: species.secondaryType,
            seen: false,
            caught: false,
            hasLivingEntry: false
        };
    });

    return {
        summary: buildDexSummary(entries),
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
            hasLivingEntry: true
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
            hasLivingEntry: true
        }
    });

    return new Map(
        dexOverrides.map((dexOverride) => {
            return [dexOverride.pokemonSpeciesId, dexOverride];
        })
    );
};

// getResolvedDexEntryState merges imported snapshot state with one manual override row.
// getSaveProfileDex uses this to return the final frontend-visible dex entry values.
const getResolvedDexEntryState = ({
    importedState,
    overrideState
}: {
    importedState?: DexState;
    overrideState?: {
        seen: boolean | null;
        caught: boolean | null;
        hasLivingEntry: boolean | null;
    };
}): DexState => {
    const baseState: DexState = {
        seen: importedState ? importedState.seen : false,
        caught: importedState ? importedState.caught : false,
        hasLivingEntry: importedState ? importedState.hasLivingEntry : false
    };

    return {
        seen: resolveOverrideValue(baseState.seen, overrideState ? overrideState.seen : undefined),
        caught: resolveOverrideValue(baseState.caught, overrideState ? overrideState.caught : undefined),
        hasLivingEntry: resolveOverrideValue(
            baseState.hasLivingEntry,
            overrideState ? overrideState.hasLivingEntry : undefined
        )
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

// hasAnyOverrideValue checks whether a patch still contains at least one persisted override field.
// updateSaveProfileDexOverride uses this to delete empty override rows instead of storing null-only rows.
const hasAnyOverrideValue = (overrideState: {
    seen: boolean | null;
    caught: boolean | null;
    hasLivingEntry: boolean | null;
}) => {
    return (
        typeof overrideState.seen === "boolean" ||
        typeof overrideState.caught === "boolean" ||
        typeof overrideState.hasLivingEntry === "boolean"
    );
};

// getSaveProfileDex returns the resolved dex payload for one save profile.
// uploads and dex controllers call this so reads stay centralized in the dex module.
export const getSaveProfileDex = async (saveProfileId: string) => {
    const pokemonSpecies = await getDexSpeciesRecords();

    const importedDexEntryBySpeciesId = await getImportedDexEntryMap(saveProfileId);
    const overrideDexEntryBySpeciesId = await getOverrideDexEntryMap(saveProfileId);

    const entries = pokemonSpecies.map((species) => {
        const resolvedState = getResolvedDexEntryState({
            importedState: importedDexEntryBySpeciesId.get(species.id),
            overrideState: overrideDexEntryBySpeciesId.get(species.id)
        });

        return {
            pokemonSpeciesId: species.id,
            dexNumber: species.dexNumber,
            name: species.name,
            generation: species.generation,
            primaryType: species.primaryType,
            secondaryType: species.secondaryType,
            seen: resolvedState.seen,
            caught: resolvedState.caught,
            hasLivingEntry: resolvedState.hasLivingEntry
        };
    });

    return {
        summary: buildDexSummary(entries),
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
            hasLivingEntry: true
        }
    });

    const nextOverrideState = {
        seen:
            Object.prototype.hasOwnProperty.call(overridePatch, "seen")
                ? overridePatch.seen === undefined
                    ? null
                    : overridePatch.seen
                : existingOverride
                    ? existingOverride.seen
                    : null,
        caught:
            Object.prototype.hasOwnProperty.call(overridePatch, "caught")
                ? overridePatch.caught === undefined
                    ? null
                    : overridePatch.caught
                : existingOverride
                    ? existingOverride.caught
                    : null,
        hasLivingEntry:
            Object.prototype.hasOwnProperty.call(overridePatch, "hasLivingEntry")
                ? overridePatch.hasLivingEntry === undefined
                    ? null
                    : overridePatch.hasLivingEntry
                : existingOverride
                    ? existingOverride.hasLivingEntry
                    : null
    };

    if (!hasAnyOverrideValue(nextOverrideState)) {
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
        update: nextOverrideState,
        create: {
            saveProfileId,
            pokemonSpeciesId,
            seen: nextOverrideState.seen,
            caught: nextOverrideState.caught,
            hasLivingEntry: nextOverrideState.hasLivingEntry
        }
    });

    return await getSaveProfileDex(saveProfileId);
};
