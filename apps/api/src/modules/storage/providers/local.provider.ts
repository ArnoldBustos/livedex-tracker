import fs from "fs/promises";
import path from "path";
import type { IStorageProvider } from "../storage.interface";
import type { UploadFileInput, UploadFileResult } from "../storage.types";

export class LocalStorageProvider implements IStorageProvider {
    async uploadFile(file: UploadFileInput): Promise<UploadFileResult> {
        const uploadsDirectory = path.resolve(process.cwd(), "uploads");
        const timestamp = Date.now();
        const safeFilename = `${timestamp}-${file.filename}`;
        const filePath = path.join(uploadsDirectory, safeFilename);

        await fs.mkdir(uploadsDirectory, { recursive: true });
        await fs.writeFile(filePath, file.buffer);

        return {
            storageKey: safeFilename,
            fileUrl: null
        };
    }

    async deleteFile(storageKey: string): Promise<void> {
        const uploadsDirectory = path.resolve(process.cwd(), "uploads");
        const filePath = path.join(uploadsDirectory, storageKey);

        try {
            await fs.unlink(filePath);
        } catch (error) {
            return;
        }
    }
}