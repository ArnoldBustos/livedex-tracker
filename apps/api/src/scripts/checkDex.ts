import prismaClient from "../lib/prisma";

const checkDex = async () => {
    const dexEntries = await prismaClient.userDexEntry.findMany({
        where: {
            user: {
                email: "dev@example.com"
            }
        },
        include: {
            pokemonSpecies: true
        },
        orderBy: {
            pokemonSpecies: {
                dexNumber: "asc"
            }
        }
    });

    const formattedEntries = dexEntries.map((dexEntry) => {
        return {
            dexNumber: dexEntry.pokemonSpecies.dexNumber,
            name: dexEntry.pokemonSpecies.name,
            seen: dexEntry.seen,
            caught: dexEntry.caught,
            hasLivingEntry: dexEntry.hasLivingEntry
        };
    });

    console.table(formattedEntries);

    console.log("total entries:", formattedEntries.length);
    console.log(
        "living entries:",
        formattedEntries.filter((dexEntry) => dexEntry.hasLivingEntry).length
    );
};

checkDex()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });