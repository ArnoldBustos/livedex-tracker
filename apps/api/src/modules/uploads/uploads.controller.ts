import type { Request, Response } from "express";
import { createUpload } from "./uploads.service";

export const uploadSaveFile = async (request: Request, response: Response) => {
    const uploadedFile = request.file;

    if (!uploadedFile) {
        response.status(400).json({
            error: "No file uploaded"
        });
        return;
    }

    const saveUpload = await createUpload({
        userId: "cmnhqj13h0000ukhw9vwo4f0b",
        file: uploadedFile
    });

    response.status(201).json({
        upload: saveUpload
    });
};