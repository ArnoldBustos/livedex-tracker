import { randomUUID } from "crypto";
import prismaClient from "../../lib/prisma";
import { syncSaveProfileDexFromParse } from "../dex/dex.service";
import { parseUploadedSave } from "../parser/parser.service";
import { getStorageProvider } from "../storage/storage.service";

type CreateUploadParams = {
    userId: string;
    file: Express.Multer.File;
    saveProfileName?: string;
    saveProfileId?: string;
};

type CreateGuestUploadParams = {
    file: Express.Multer.File;
    saveProfileName?: string;
};

// buildGuestDexResponse converts parser output into the frontend dex response shape
// createGuestUpload uses this so guest mode can render dex data without persisting DB rows
const buildGuestDexResponse = async ({
    seenNationalDexNumbers,
    caughtNationalDexNumbers,
    livingNationalDexNumbers
}: {
    seenNationalDexNumbers: number[];
    caughtNationalDexNumbers: number[];
    livingNationalDexNumbers: number[];
}) => {
    const pokemonSpecies = await prismaClient.pokemonSpecies.findMany({
        orderBy: {
            dexNumber: "asc"
        }
    });

    const seenDexNumberSet = new Set(seenNationalDexNumbers);
    const caughtDexNumberSet = new Set(caughtNationalDexNumbers);
    const livingDexNumberSet = new Set(livingNationalDexNumbers);

    const entries = pokemonSpecies.map((species) => {
        return {
            pokemonSpeciesId: species.id,
            dexNumber: species.dexNumber,
            name: species.name,
            generation: species.generation,
            primaryType: species.primaryType,
            secondaryType: species.secondaryType,
            seen: seenDexNumberSet.has(species.dexNumber),
            caught: caughtDexNumberSet.has(species.dexNumber),
            hasLivingEntry: livingDexNumberSet.has(species.dexNumber)
        };
    });

    return {
        summary: {
            totalEntries: entries.length,
            seenCount: entries.filter((entry) => entry.seen).length,
            caughtCount: entries.filter((entry) => entry.caught).length,
            livingCount: entries.filter((entry) => entry.hasLivingEntry).length
        },
        entries
    };
};

type ListSaveProfilesParams = {
    userId: string;
};

type GetSaveProfileDetailsParams = {
    userId: string;
    saveProfileId: string;
};

type DeleteSaveProfileParams = {
    userId: string;
    saveProfileId: string;
};

const resolveSaveProfile = async ({
    userId,
    saveProfileId,
    saveProfileName,
    detectedGame
}: {
    userId: string;
    saveProfileId?: string;
    saveProfileName?: string;
    detectedGame?: "RUBY" | "SAPPHIRE" | "EMERALD" | "FIRERED" | "LEAFGREEN";
}) => {
    if (saveProfileId) {
        const existingProfile = await prismaClient.saveProfile.findFirst({
            where: {
                id: saveProfileId,
                userId
            }
        });

        if (!existingProfile) {
            throw new Error("Save profile not found");
        }

        if (!existingProfile.game && detectedGame) {
            return prismaClient.saveProfile.update({
                where: {
                    id: existingProfile.id
                },
                data: {
                    game: detectedGame
                }
            });
        }

        return existingProfile;
    }

    const nextProfileName =
        saveProfileName && saveProfileName.trim().length > 0
            ? saveProfileName.trim()
            : detectedGame
                ? `${detectedGame} Playthrough`
                : "Untitled Save Profile";

    const existingNamedProfile = await prismaClient.saveProfile.findFirst({
        where: {
            userId,
            name: nextProfileName
        }
    });

    if (existingNamedProfile) {
        if (!existingNamedProfile.game && detectedGame) {
            return prismaClient.saveProfile.update({
                where: {
                    id: existingNamedProfile.id
                },
                data: {
                    game: detectedGame
                }
            });
        }

        return existingNamedProfile;
    }

    return prismaClient.saveProfile.create({
        data: {
            userId,
            name: nextProfileName,
            game: detectedGame
        }
    });
};

export const listSaveProfiles = async ({
    userId
}: ListSaveProfilesParams) => {
    return prismaClient.saveProfile.findMany({
        where: {
            userId
        },
        orderBy: {
            updatedAt: "desc"
        }
    });
};

export const getSaveProfileDetails = async ({
    userId,
    saveProfileId
}: GetSaveProfileDetailsParams) => {
    const saveProfile = await prismaClient.saveProfile.findFirst({
        where: {
            id: saveProfileId,
            userId
        }
    });

    if (!saveProfile) {
        throw new Error("Save profile not found");
    }

    const latestUpload = await prismaClient.saveUpload.findFirst({
        where: {
            saveProfileId: saveProfile.id,
            userId,
            parseStatus: "COMPLETED"
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    if (!latestUpload) {
        throw new Error("No completed upload found for this save profile");
    }

    return {
        upload: latestUpload,
        saveProfile,
        trainerInfo:
            latestUpload.trainerName || latestUpload.trainerGender
                ? {
                    name: latestUpload.trainerName || "Unknown Trainer",
                    gender: latestUpload.trainerGender || "Unknown"
                }
                : undefined,
        debug: undefined
    };
};

export const deleteSaveProfile = async ({
    userId,
    saveProfileId
}: DeleteSaveProfileParams) => {
    const saveProfile = await prismaClient.saveProfile.findFirst({
        where: {
            id: saveProfileId,
            userId
        }
    });

    if (!saveProfile) {
        throw new Error("Save profile not found");
    }

    const uploads = await prismaClient.saveUpload.findMany({
        where: {
            saveProfileId: saveProfile.id,
            userId
        },
        select: {
            id: true,
            storageKey: true
        }
    });

    const storageProvider = getStorageProvider();

    await Promise.all(
        uploads.map(async (upload) => {
            try {
                await storageProvider.deleteFile(upload.storageKey);
            } catch (error) {
                console.error("Failed to delete stored upload file", {
                    saveProfileId,
                    uploadId: upload.id,
                    storageKey: upload.storageKey,
                    error
                });
            }
        })
    );

    await prismaClient.saveProfile.delete({
        where: {
            id: saveProfile.id
        }
    });

    return {
        deletedSaveProfileId: saveProfile.id
    };
};

// createGuestUpload parses a guest save without creating persistent save profile or upload records
// uploads.controller.ts calls this for guest mode so guest uploads stay temporary and isolated
export const createGuestUpload = async ({
    file,
    saveProfileName
}: CreateGuestUploadParams) => {
    const parseResult = await parseUploadedSave(file.buffer);
    const now = new Date().toISOString();

    const nextProfileName =
        saveProfileName && saveProfileName.trim().length > 0
            ? saveProfileName.trim()
            : parseResult.detectedGame
                ? `${parseResult.detectedGame} Guest Session`
                : "Guest Session";

    const dexResponse = await buildGuestDexResponse({
        seenNationalDexNumbers: parseResult.pokedexFlags.seenNationalDexNumbers,
        caughtNationalDexNumbers: parseResult.pokedexFlags.ownedNationalDexNumbers,
        livingNationalDexNumbers: parseResult.debug.livingNationalDexNumbers
    });

    return {
        upload: {
            id: `guest-upload-${randomUUID()}`,
            userId: "guest",
            saveProfileId: "guest-session",
            originalFilename: file.originalname,
            storageProvider: "LOCAL",
            storageKey: `guest/${file.originalname}`,
            fileUrl: null,
            fileSizeBytes: file.size,
            parseStatus: "COMPLETED",
            detectedGame: parseResult.detectedGame,
            parseError: null,
            trainerName: parseResult.trainerInfo.name,
            trainerGender: parseResult.trainerInfo.gender,
            createdAt: now,
            updatedAt: now
        },
        saveProfile: {
            id: "guest-session",
            userId: "guest",
            name: nextProfileName,
            game: parseResult.detectedGame,
            createdAt: now,
            updatedAt: now
        },
        trainerInfo: parseResult.trainerInfo,
        dex: dexResponse,
        debug: parseResult.debug
    };
};

export const createUpload = async ({
    userId,
    file,
    saveProfileName,
    saveProfileId
}: CreateUploadParams) => {
    const storageProvider = getStorageProvider();

    const storedFile = await storageProvider.uploadFile({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype
    });

    try {
        console.log("createUpload input", {
            userId,
            originalFilename: file.originalname,
            fileSizeBytes: file.size,
            saveProfileId,
            saveProfileName
        });

        const parseResult = await parseUploadedSave(file.buffer);

        const saveProfile = await resolveSaveProfile({
            userId,
            saveProfileId,
            saveProfileName,
            detectedGame: parseResult.detectedGame
        });

        const createdUpload = await prismaClient.saveUpload.create({
            data: {
                userId,
                saveProfileId: saveProfile.id,
                originalFilename: file.originalname,
                storageProvider: "LOCAL",
                storageKey: storedFile.storageKey,
                fileUrl: storedFile.fileUrl,
                fileSizeBytes: file.size,
                detectedGame: parseResult.detectedGame,
                parseStatus: "PROCESSING"
            }
        });

        await syncSaveProfileDexFromParse({
            saveProfileId: saveProfile.id,
            seenNationalDexNumbers: parseResult.pokedexFlags.seenNationalDexNumbers,
            caughtNationalDexNumbers: parseResult.pokedexFlags.ownedNationalDexNumbers,
            livingNationalDexNumbers: parseResult.debug.livingNationalDexNumbers
        });

        const updatedUpload = await prismaClient.saveUpload.update({
            where: {
                id: createdUpload.id
            },
            data: {
                parseStatus: "COMPLETED",
                detectedGame: parseResult.detectedGame,
                parseError: null,
                trainerName: parseResult.trainerInfo.name,
                trainerGender: parseResult.trainerInfo.gender
            }
        });

        return {
            upload: updatedUpload,
            saveProfile,
            trainerInfo: parseResult.trainerInfo,
            debug: parseResult.debug
        };
    } catch (error) {
        console.error("createUpload failed", error);

        throw error;
    }
};