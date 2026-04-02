import prismaClient from "../../lib/prisma";

type SyncUserDexFromParseParams = {
    userId: string;
    seenNationalDexNumbers: number[];
    caughtNationalDexNumbers: number[];
    livingNationalDexNumbers: number[];
};

export const syncUserDexFromParse = async ({
    userId,
    seenNationalDexNumbers,
    caughtNationalDexNumbers,
    livingNationalDexNumbers
}: SyncUserDexFromParseParams) => {
    console.log("syncUserDexFromParse input", {
        userId,
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

    console.log("syncUserDexFromParse allDexNumbers", allDexNumbers);

    const seenDexNumberSet = new Set(seenNationalDexNumbers);
    const caughtDexNumberSet = new Set(caughtNationalDexNumbers);
    const livingDexNumberSet = new Set(livingNationalDexNumbers);

    if (allDexNumbers.length === 0) {
        console.log("syncUserDexFromParse skipped because allDexNumbers is empty");

        await prismaClient.userDexEntry.updateMany({
            where: {
                userId,
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

    console.log("syncUserDexFromParse matchingSpecies", matchingSpecies);

    for (const pokemonSpecies of matchingSpecies) {
        const isSeen = seenDexNumberSet.has(pokemonSpecies.dexNumber);
        const isCaught = caughtDexNumberSet.has(pokemonSpecies.dexNumber);
        const hasLivingEntry = livingDexNumberSet.has(pokemonSpecies.dexNumber);

        await prismaClient.userDexEntry.upsert({
            where: {
                userId_pokemonSpeciesId: {
                    userId,
                    pokemonSpeciesId: pokemonSpecies.id
                }
            },
            update: {
                seen: isSeen,
                caught: isCaught,
                hasLivingEntry
            },
            create: {
                userId,
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

    await prismaClient.userDexEntry.updateMany({
        where: {
            userId,
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

export const getUserDex = async (userId: string) => {
    const dexEntries = await prismaClient.userDexEntry.findMany({
        where: {
            userId
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