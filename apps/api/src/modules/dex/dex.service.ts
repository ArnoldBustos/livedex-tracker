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
                hasLivingEntry: true
            },
            data: {
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
    const dexEntries = await prismaClient.saveProfileDexEntry.findMany({
        where: {
            saveProfileId
        },
        include: {
            pokemonSpecies: {
                select: {
                    id: true,
                    dexNumber: true,
                    name: true,
                    generation: true
                }
            }
        },
        orderBy: {
            pokemonSpecies: {
                dexNumber: "asc"
            }
        }
    });

    const entries = dexEntries.map((dexEntry) => {
        return {
            pokemonSpeciesId: dexEntry.pokemonSpeciesId,
            dexNumber: dexEntry.pokemonSpecies.dexNumber,
            name: dexEntry.pokemonSpecies.name,
            generation: dexEntry.pokemonSpecies.generation,
            seen: dexEntry.seen,
            caught: dexEntry.caught,
            hasLivingEntry: dexEntry.hasLivingEntry
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