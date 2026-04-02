import prismaClient from "../../lib/prisma";

type SyncUserDexFromParseParams = {
    userId: string;
    seenNationalDexNumbers: number[];
    ownedNationalDexNumbers: number[];
};

export const syncUserDexFromParse = async ({
    userId,
    seenNationalDexNumbers,
    ownedNationalDexNumbers
}: SyncUserDexFromParseParams) => {
    console.log("syncUserDexFromParse input", {
        userId,
        seenNationalDexNumbers,
        ownedNationalDexNumbers
    });

    const allDexNumbers = Array.from(
        new Set([
            ...seenNationalDexNumbers,
            ...ownedNationalDexNumbers
        ])
    );

    console.log("syncUserDexFromParse allDexNumbers", allDexNumbers);

    if (allDexNumbers.length === 0) {
        console.log("syncUserDexFromParse skipped because allDexNumbers is empty");

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

    const ownedDexNumberSet = new Set(ownedNationalDexNumbers);
    const seenDexNumberSet = new Set(seenNationalDexNumbers);

    for (const pokemonSpecies of matchingSpecies) {
        const isSeen = seenDexNumberSet.has(pokemonSpecies.dexNumber) || ownedDexNumberSet.has(pokemonSpecies.dexNumber);
        const isCaught = ownedDexNumberSet.has(pokemonSpecies.dexNumber);

        console.log("syncUserDexFromParse upserting", {
            userId,
            pokemonSpeciesId: pokemonSpecies.id,
            dexNumber: pokemonSpecies.dexNumber,
            isSeen,
            isCaught
        });

        await prismaClient.userDexEntry.upsert({
            where: {
                userId_pokemonSpeciesId: {
                    userId,
                    pokemonSpeciesId: pokemonSpecies.id
                }
            },
            update: {
                seen: isSeen,
                caught: isCaught
            },
            create: {
                userId,
                pokemonSpeciesId: pokemonSpecies.id,
                seen: isSeen,
                caught: isCaught
            }
        });
    }

    return {
        updatedCount: matchingSpecies.length
    };
};