import prismaClient from "../../lib/prisma";

type SyncSaveProfileDexFromParseParams = {
    saveProfileId: string;
    seenNationalDexNumbers: number[];
    caughtNationalDexNumbers: number[];
    livingNationalDexNumbers: number[];
};

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

export const getSaveProfileDex = async (saveProfileId: string) => {
    const pokemonSpecies = await prismaClient.pokemonSpecies.findMany({
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

    const dexEntryBySpeciesId = new Map(
        dexEntries.map((dexEntry) => {
            return [dexEntry.pokemonSpeciesId, dexEntry];
        })
    );

    const entries = pokemonSpecies.map((species) => {
        const matchingDexEntry = dexEntryBySpeciesId.get(species.id);

        return {
            pokemonSpeciesId: species.id,
            dexNumber: species.dexNumber,
            name: species.name,
            generation: species.generation,
            primaryType: species.primaryType,
            secondaryType: species.secondaryType,
            seen: matchingDexEntry ? matchingDexEntry.seen : false,
            caught: matchingDexEntry ? matchingDexEntry.caught : false,
            hasLivingEntry: matchingDexEntry ? matchingDexEntry.hasLivingEntry : false
        };
    });

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
        summary: {
            totalEntries: entries.length,
            seenCount,
            caughtCount,
            livingCount
        },
        entries
    };
};
