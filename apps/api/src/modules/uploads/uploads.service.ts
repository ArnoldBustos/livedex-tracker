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

    try {
        console.log("createUpload input", {
            userId,
            originalFilename: file.originalname,
            fileSizeBytes: file.size
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

        const parseResult = await parseUploadedSave(file.buffer);

        const livingNationalDexNumbers = Array.from(
            new Set(
                [...parseResult.partyPokemon, ...parseResult.boxPokemon].map((pokemon) => {
                    return pokemon.speciesId;
                })
            )
        );

        await syncUserDexFromParse({
            userId,
            seenNationalDexNumbers: parseResult.pokedexFlags.seenNationalDexNumbers,
            caughtNationalDexNumbers: parseResult.pokedexFlags.ownedNationalDexNumbers,
            livingNationalDexNumbers
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
            debug: parseResult.debug
        };
    } catch (error) {
        console.error("createUpload failed", error);

        throw error;
    }
};