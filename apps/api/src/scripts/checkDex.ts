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

    console.log(JSON.stringify(dexEntries, null, 2));
};

checkDex()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });