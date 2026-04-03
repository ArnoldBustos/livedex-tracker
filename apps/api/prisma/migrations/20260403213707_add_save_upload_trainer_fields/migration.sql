-- CreateEnum
CREATE TYPE "SaveParseStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'SUPABASE', 'S3');

-- CreateEnum
CREATE TYPE "SupportedGame" AS ENUM ('RUBY', 'SAPPHIRE', 'EMERALD', 'FIRERED', 'LEAFGREEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "game" "SupportedGame",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saveProfileId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSizeBytes" INTEGER NOT NULL,
    "parseStatus" "SaveParseStatus" NOT NULL DEFAULT 'PENDING',
    "detectedGame" "SupportedGame",
    "parseError" TEXT,
    "trainerName" TEXT,
    "trainerGender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonSpecies" (
    "id" INTEGER NOT NULL,
    "dexNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PokemonSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveProfileDexEntry" (
    "id" TEXT NOT NULL,
    "saveProfileId" TEXT NOT NULL,
    "pokemonSpeciesId" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "caught" BOOLEAN NOT NULL DEFAULT false,
    "hasLivingEntry" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveProfileDexEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SaveProfile_userId_name_key" ON "SaveProfile"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonSpecies_dexNumber_key" ON "PokemonSpecies"("dexNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SaveProfileDexEntry_saveProfileId_pokemonSpeciesId_key" ON "SaveProfileDexEntry"("saveProfileId", "pokemonSpeciesId");

-- AddForeignKey
ALTER TABLE "SaveProfile" ADD CONSTRAINT "SaveProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveUpload" ADD CONSTRAINT "SaveUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveUpload" ADD CONSTRAINT "SaveUpload_saveProfileId_fkey" FOREIGN KEY ("saveProfileId") REFERENCES "SaveProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveProfileDexEntry" ADD CONSTRAINT "SaveProfileDexEntry_saveProfileId_fkey" FOREIGN KEY ("saveProfileId") REFERENCES "SaveProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaveProfileDexEntry" ADD CONSTRAINT "SaveProfileDexEntry_pokemonSpeciesId_fkey" FOREIGN KEY ("pokemonSpeciesId") REFERENCES "PokemonSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
