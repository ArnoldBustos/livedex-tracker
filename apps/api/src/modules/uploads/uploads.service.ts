import prismaClient from "../../lib/prisma";
import { syncUserDexFromParse } from "../dex/dex.service";
import { parseUploadedSave } from "../parser/parser.service";
import { getStorageProvider } from "../storage/storage.service";

type CreateUploadParams = {
    userId: string;
    file: Express.Multer.File;
};

export const createUpload = async ({
    userId,
    file
}: CreateUploadParams) => {
    const storageProvider = getStorageProvider();

    const storedFile = await storageProvider.uploadFile({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype
    });

    const createdUpload = await prismaClient.saveUpload.create({
        data: {
            userId,
            originalFilename: file.originalname,
            storageProvider: "LOCAL",
            storageKey: storedFile.storageKey,
            fileUrl: storedFile.fileUrl,
            fileSizeBytes: file.size
        }
    });

    try {
        const parseResult = await parseUploadedSave(file.buffer);

        console.log("createUpload parseResult", parseResult);

        await syncUserDexFromParse({
            userId,
            seenNationalDexNumbers: parseResult.pokedexFlags.seenNationalDexNumbers,
            ownedNationalDexNumbers: parseResult.pokedexFlags.ownedNationalDexNumbers
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

        return updatedUpload;
    } catch (error) {
        const parseErrorMessage =
            error instanceof Error ? error.message : "Unknown parse error";

        const failedUpload = await prismaClient.saveUpload.update({
            where: {
                id: createdUpload.id
            },
            data: {
                parseStatus: "FAILED",
                parseError: parseErrorMessage
            }
        });

        return failedUpload;
    }
};