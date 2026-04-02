import { pokemonSpeciesSeedData } from "../data/pokemonSpecies";
import prismaClient from "../lib/prisma";

const seed = async () => {
    const existingUser = await prismaClient.user.findUnique({
        where: {
            email: "dev@example.com"
        }
    });

    if (!existingUser) {
        const createdUser = await prismaClient.user.create({
            data: {
                email: "dev@example.com",
                username: "devuser"
            }
        });

        console.log("Created dev user:", createdUser.id);
    } else {
        console.log("Dev user already exists:", existingUser.id);
    }

    for (const pokemonSpecies of pokemonSpeciesSeedData) {
        await prismaClient.pokemonSpecies.upsert({
            where: {
                id: pokemonSpecies.id
            },
            update: {
                dexNumber: pokemonSpecies.dexNumber,
                name: pokemonSpecies.name,
                generation: pokemonSpecies.generation,
                isAvailable: true
            },
            create: {
                id: pokemonSpecies.id,
                dexNumber: pokemonSpecies.dexNumber,
                name: pokemonSpecies.name,
                generation: pokemonSpecies.generation,
                isAvailable: true
            }
        });
    }

    console.log(`Seeded ${pokemonSpeciesSeedData.length} Pokémon species`);
};

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });