import { env } from "../config/env";
import { pokemonSpeciesSeedData } from "../data/pokemonSpecies";
import prismaClient from "../lib/prisma";
import { ensureLocalDevAccount } from "../modules/auth/localDevAccount.service";

// seedLocalDevAccount ensures the canonical local development user exists before future real-auth migration work.
// seed.ts calls this so dev@example.com stays attached to the same User row that already owns local save data.
const seedLocalDevAccount = async () => {
    const bootstrapResult = await ensureLocalDevAccount();

    if (env.ENABLE_LOCAL_DEV_ACCOUNT) {
        console.log("Local dev account bootstrap enabled:", JSON.stringify(bootstrapResult, null, 2));
        return;
    }

    console.log(
        "Canonical dev user preserved for compatibility. Set ENABLE_LOCAL_DEV_ACCOUNT=true to make local auth bootstrapping explicit."
    );
};

const seed = async () => {
    await seedLocalDevAccount();

    for (const pokemonSpecies of pokemonSpeciesSeedData) {
        await prismaClient.pokemonSpecies.upsert({
            where: {
                id: pokemonSpecies.id
            },
            update: {
                dexNumber: pokemonSpecies.dexNumber,
                name: pokemonSpecies.name,
                generation: pokemonSpecies.generation,
                primaryType: pokemonSpecies.primaryType,
                secondaryType: pokemonSpecies.secondaryType,
                isAvailable: true
            },
            create: {
                id: pokemonSpecies.id,
                dexNumber: pokemonSpecies.dexNumber,
                name: pokemonSpecies.name,
                generation: pokemonSpecies.generation,
                primaryType: pokemonSpecies.primaryType,
                secondaryType: pokemonSpecies.secondaryType,
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
