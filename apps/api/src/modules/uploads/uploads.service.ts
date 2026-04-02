import prismaClient from "../../lib/prisma";
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

    const saveUpload = await prismaClient.saveUpload.create({
        data: {
            userId,
            originalFilename: file.originalname,
            storageProvider: "LOCAL",
            storageKey: storedFile.storageKey,
            fileUrl: storedFile.fileUrl,
            fileSizeBytes: file.size
        }
    });

    return saveUpload;
};