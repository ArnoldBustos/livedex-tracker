import { randomUUID } from "crypto";
import {
    MANUAL_GEN3_GAME_OVERRIDES,
    SUPPORTED_GAMES,
    type ManualGen3GameOverride,
    type SupportedGame,
    type UploadManualGameSelectionRequirement
} from "../../../../../packages/shared/src";
import prismaClient from "../../lib/prisma";
import { getSaveProfileDex, syncSaveProfileDexFromParse } from "../dex/dex.service";
import { parseUploadedSave } from "../parser/parser.service";
import type { ImportedDexSnapshot } from "../parser/gen3/buildImportedDexSnapshot";
import { getStorageProvider } from "../storage/storage.service";

// CreateUploadResult stores either a completed upload payload or a manual FRLG selection requirement.
export type CreateUploadResult =
    | Awaited<ReturnType<typeof buildCompletedUploadResult>>
    | UploadManualGameSelectionRequirement;

type CreateUploadParams = {
    userId: string;
    file: Express.Multer.File;
    saveProfileName?: string;
    saveProfileId?: string;
    manualGameOverride?: ManualGen3GameOverride;
};

type CreateGuestUploadParams = {
    file: Express.Multer.File;
    saveProfileName?: string;
    manualGameOverride?: ManualGen3GameOverride;
};

// buildGuestDexResponse converts parser output into the frontend dex response shape
// createGuestUpload uses this so guest mode can render dex data without persisting DB rows
const buildGuestDexResponse = async ({
    importedDexSnapshot
}: {
    importedDexSnapshot: ImportedDexSnapshot;
}) => {
    const pokemonSpecies = await prismaClient.pokemonSpecies.findMany({
        orderBy: {
            dexNumber: "asc"
        }
    });
    const importedSnapshotByDexNumber = new Map(
        importedDexSnapshot.entries.map((entry) => {
            return [entry.dexNumber, entry];
        })
    );
    const entries = pokemonSpecies.map((species) => {
        const importedSnapshotEntry = importedSnapshotByDexNumber.get(species.dexNumber);

        return {
            pokemonSpeciesId: species.id,
            dexNumber: species.dexNumber,
            name: species.name,
            generation: species.generation,
            primaryType: species.primaryType,
            secondaryType: species.secondaryType,
            standard: importedSnapshotEntry
                ? importedSnapshotEntry.standard
                : {
                    seen: false,
                    caught: false,
                    hasLivingEntry: false
                },
            shiny: importedSnapshotEntry
                ? importedSnapshotEntry.shiny
                : {
                    seen: false,
                    caught: false,
                    hasLivingEntry: false
                },
            ownership: importedSnapshotEntry
                ? importedSnapshotEntry.ownership
                : {
                    totalOwnedCount: 0,
                    shinyOwnedCount: 0
                }
        };
    });

    return {
        summary: importedDexSnapshot.summary,
        entries
    };
};

// getIsManualGen3GameOverride checks whether one raw request value is an allowed FRLG title override.
export const getIsManualGen3GameOverride = (
    value: string
): value is ManualGen3GameOverride => {
    return MANUAL_GEN3_GAME_OVERRIDES.includes(value as ManualGen3GameOverride);
};

// getIsSupportedGame checks whether one raw request value is an allowed saved-profile game id.
// uploads.controller.ts uses this so metadata edits accept only the shared supported game values.
export const getIsSupportedGame = (value: string): value is SupportedGame => {
    return SUPPORTED_GAMES.includes(value as SupportedGame);
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

type UpdateSaveProfileMetadataParams = {
    userId: string;
    saveProfileId: string;
    name: string;
    game: SupportedGame | null;
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
    // detectedGame can stay null when the parser knows the FRLG layout but cannot prove FireRed vs LeafGreen.
    detectedGame?: SupportedGame | null;
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

// getRequiresManualGameSelection checks whether a parsed FRLG save still needs a user title choice.
const getRequiresManualGameSelection = ({
    detectedGame,
    detectedLayout,
    manualGameOverride
}: {
    detectedGame: SupportedGame | null;
    detectedLayout: "RUBY_SAPPHIRE" | "EMERALD" | "FRLG";
    manualGameOverride?: ManualGen3GameOverride;
}): boolean => {
    return detectedLayout === "FRLG" &&
        detectedGame === null &&
        typeof manualGameOverride !== "string";
};

// createManualGameSelectionRequirement builds the shared API response that asks the frontend for FireRed or LeafGreen.
const createManualGameSelectionRequirement = (): UploadManualGameSelectionRequirement => {
    return {
        status: "manual-game-selection-required",
        detectedLayout: "FRLG",
        detectedGame: null,
        allowedGames: MANUAL_GEN3_GAME_OVERRIDES,
        message: "This Gen 3 save uses the FireRed/LeafGreen layout. Choose FireRed or LeafGreen to continue."
    };
};

// resolveUploadDetectedGame finalizes the game stored for the upload after combining parser output with any manual override.
const resolveUploadDetectedGame = ({
    detectedGame,
    detectedLayout,
    manualGameOverride,
    originalFilename
}: {
    detectedGame: SupportedGame | null;
    detectedLayout: "RUBY_SAPPHIRE" | "EMERALD" | "FRLG";
    manualGameOverride?: ManualGen3GameOverride;
    // originalFilename provides a Ruby/Sapphire fallback signal when layout detection cannot choose the exact title.
    originalFilename?: string;
}): SupportedGame | null => {
    if (getRequiresManualGameSelection({
        detectedGame,
        detectedLayout,
        manualGameOverride
    })) {
        return null;
    }

    if (detectedLayout === "FRLG" && detectedGame === null) {
        return manualGameOverride || null;
    }

    if (typeof manualGameOverride === "string") {
        throw new Error("Manual game override is only allowed for FireRed/LeafGreen layout saves that need a title choice");
    }

    // Ruby/Sapphire fallback detection uses the upload filename when parser detection is still ambiguous.
    if (detectedLayout === "RUBY_SAPPHIRE" && detectedGame === null) {
        if (originalFilename) {
            // lowerFilename normalizes the uploaded name so Ruby/Sapphire keyword checks stay case-insensitive.
            const lowerFilename = originalFilename.toLowerCase();

            if (lowerFilename.includes("sapphire")) {
                return "SAPPHIRE";
            }

            if (lowerFilename.includes("ruby")) {
                return "RUBY";
            }
        }

        // Default Ruby keeps uploads usable when the filename does not distinguish Ruby from Sapphire.
        return "RUBY";
    }

    return detectedGame;
};

// buildCompletedUploadResult assembles the shared completed upload payload returned to the frontend.
const buildCompletedUploadResult = async ({
    upload,
    saveProfile,
    trainerInfo,
    debug,
    dex
}: {
    upload: {
        id: string;
        userId: string;
        saveProfileId: string;
        originalFilename: string;
        storageProvider: string;
        storageKey: string;
        fileUrl: string | null;
        fileSizeBytes: number;
        parseStatus: string;
        detectedGame: SupportedGame | null;
        parseError: string | null;
        trainerName: string | null;
        trainerGender: string | null;
        createdAt: string | Date;
        updatedAt: string | Date;
    };
    saveProfile: {
        id: string;
        userId: string;
        name: string;
        game: SupportedGame | null;
        createdAt: string | Date;
        updatedAt: string | Date;
    };
    trainerInfo: {
        name: string;
        gender: string;
    };
    debug: Awaited<ReturnType<typeof parseUploadedSave>>["debug"];
    dex?: Awaited<ReturnType<typeof getSaveProfileDex>>;
}) => {
    return {
        status: "completed" as const,
        upload,
        saveProfile,
        trainerInfo,
        dex,
        debug
    };
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
        dex: await getSaveProfileDex(saveProfile.id),
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

// updateSaveProfileMetadata updates one saved profile's editable name and game fields.
// uploads.controller.ts calls this so dashboard metadata edits stay separate from upload replacement flow.
export const updateSaveProfileMetadata = async ({
    userId,
    saveProfileId,
    name,
    game
}: UpdateSaveProfileMetadataParams) => {
    const saveProfile = await prismaClient.saveProfile.findFirst({
        where: {
            id: saveProfileId,
            userId
        }
    });

    if (!saveProfile) {
        throw new Error("Save profile not found");
    }

    return prismaClient.saveProfile.update({
        where: {
            id: saveProfile.id
        },
        data: {
            name,
            game
        }
    });
};

// createGuestUpload parses a guest save without creating persistent save profile or upload records
// uploads.controller.ts calls this for guest mode so guest uploads stay temporary and isolated
export const createGuestUpload = async ({
    file,
    saveProfileName,
    manualGameOverride
}: CreateGuestUploadParams): Promise<CreateUploadResult> => {
    const parseResult = await parseUploadedSave(file.buffer);
    const resolvedDetectedGame = resolveUploadDetectedGame({
        detectedGame: parseResult.detectedGame,
        detectedLayout: parseResult.detectedLayout,
        manualGameOverride,
        originalFilename: file.originalname
    });

    if (getRequiresManualGameSelection({
        detectedGame: parseResult.detectedGame,
        detectedLayout: parseResult.detectedLayout,
        manualGameOverride
    })) {
        return createManualGameSelectionRequirement();
    }

    const now = new Date().toISOString();

    const nextProfileName =
        saveProfileName && saveProfileName.trim().length > 0
            ? saveProfileName.trim()
            : resolvedDetectedGame
                ? `${resolvedDetectedGame} Guest Session`
                : "Guest Session";

    const dexResponse = await buildGuestDexResponse({
        importedDexSnapshot: parseResult.importedDexSnapshot
    });

    return buildCompletedUploadResult({
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
            detectedGame: resolvedDetectedGame,
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
            game: resolvedDetectedGame,
            createdAt: now,
            updatedAt: now
        },
        trainerInfo: parseResult.trainerInfo,
        dex: dexResponse,
        debug: parseResult.debug
    });
};

export const createUpload = async ({
    userId,
    file,
    saveProfileName,
    saveProfileId,
    manualGameOverride
}: CreateUploadParams): Promise<CreateUploadResult> => {
    const storageProvider = getStorageProvider();

    try {
        console.log("createUpload input", {
            userId,
            originalFilename: file.originalname,
            fileSizeBytes: file.size,
            saveProfileId,
            saveProfileName,
            manualGameOverride
        });

        const parseResult = await parseUploadedSave(file.buffer);
        const resolvedDetectedGame = resolveUploadDetectedGame({
            detectedGame: parseResult.detectedGame,
            detectedLayout: parseResult.detectedLayout,
            manualGameOverride,
            originalFilename: file.originalname
        });

        if (getRequiresManualGameSelection({
            detectedGame: parseResult.detectedGame,
            detectedLayout: parseResult.detectedLayout,
            manualGameOverride
        })) {
            return createManualGameSelectionRequirement();
        }

        const storedFile = await storageProvider.uploadFile({
            buffer: file.buffer,
            filename: file.originalname,
            mimeType: file.mimetype
        });

        const saveProfile = await resolveSaveProfile({
            userId,
            saveProfileId,
            saveProfileName,
            detectedGame: resolvedDetectedGame
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
                detectedGame: resolvedDetectedGame,
                parseStatus: "PROCESSING"
            }
        });

        await syncSaveProfileDexFromParse({
            saveProfileId: saveProfile.id,
            importedDexSnapshot: parseResult.importedDexSnapshot
        });

        const updatedUpload = await prismaClient.saveUpload.update({
            where: {
                id: createdUpload.id
            },
            data: {
                parseStatus: "COMPLETED",
                detectedGame: resolvedDetectedGame,
                parseError: null,
                trainerName: parseResult.trainerInfo.name,
                trainerGender: parseResult.trainerInfo.gender
            }
        });

        return buildCompletedUploadResult({
            upload: updatedUpload,
            saveProfile,
            trainerInfo: parseResult.trainerInfo,
            dex: await getSaveProfileDex(saveProfile.id),
            debug: parseResult.debug
        });
    } catch (error) {
        console.error("createUpload failed", error);

        throw error;
    }
};
