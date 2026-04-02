import type { UploadFileInput, UploadFileResult } from "./storage.types";

export interface IStorageProvider {
    uploadFile(file: UploadFileInput): Promise<UploadFileResult>;
    deleteFile(storageKey: string): Promise<void>;
}