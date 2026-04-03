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

type ListSaveProfilesParams = {
    userId: string;
};

type GetSaveProfileDetailsParams = {
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
        trainerInfo: undefined,
        debug: undefined
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
                parseError: null
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