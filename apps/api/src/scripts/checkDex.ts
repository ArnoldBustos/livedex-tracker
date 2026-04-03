import prismaClient from "../lib/prisma";

const checkDex = async () => {
    const dexEntries = await prismaClient.saveProfileDexEntry.findMany({
        where: {
            saveProfile: {
                user: {
                    email: "dev@example.com"
                }
            }
        },
        include: {
            pokemonSpecies: true,
            saveProfile: true
        },
        orderBy: {
            pokemonSpecies: {
                dexNumber: "asc"
            }
        }
    });

    const formattedEntries = dexEntries.map((dexEntry: typeof dexEntries[number]) => {
        return {
            saveProfileName: dexEntry.saveProfile.name,
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
        formattedEntries.filter((dexEntry: typeof formattedEntries[number]) => dexEntry.hasLivingEntry).length
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