export type UploadFileInput = {
    buffer: Buffer;
    filename: string;
    mimeType: string;
};

export type UploadFileResult = {
    storageKey: string;
    fileUrl: string | null;
};