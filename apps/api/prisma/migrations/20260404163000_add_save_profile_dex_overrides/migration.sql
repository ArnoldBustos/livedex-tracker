CREATE TABLE "SaveProfileDexOverride" (
    "id" TEXT NOT NULL,
    "saveProfileId" TEXT NOT NULL,
    "pokemonSpeciesId" INTEGER NOT NULL,
    "seen" BOOLEAN,
    "caught" BOOLEAN,
    "hasLivingEntry" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveProfileDexOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaveProfileDexOverride_saveProfileId_pokemonSpeciesId_key" ON "SaveProfileDexOverride"("saveProfileId", "pokemonSpeciesId");

ALTER TABLE "SaveProfileDexOverride" ADD CONSTRAINT "SaveProfileDexOverride_saveProfileId_fkey" FOREIGN KEY ("saveProfileId") REFERENCES "SaveProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SaveProfileDexOverride" ADD CONSTRAINT "SaveProfileDexOverride_pokemonSpeciesId_fkey" FOREIGN KEY ("pokemonSpeciesId") REFERENCES "PokemonSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
