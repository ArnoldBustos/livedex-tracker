import type { Request, Response } from "express";
import prismaClient from "../../lib/prisma";
import { createUpload } from "./uploads.service";

export const uploadSaveFile = async (request: Request, response: Response) => {
    const uploadedFile = request.file;
    const saveProfileName =
        typeof request.body.saveProfileName === "string"
            ? request.body.saveProfileName.trim()
            : "";
    const saveProfileId =
        typeof request.body.saveProfileId === "string"
            ? request.body.saveProfileId.trim()
            : "";

    if (!uploadedFile) {
        response.status(400).json({
            error: "No file uploaded"
        });
        return;
    }

    const devUser = await prismaClient.user.findUnique({
        where: {
            email: "dev@example.com"
        },
        select: {
            id: true
        }
    });

    if (!devUser) {
        response.status(500).json({
            error: "Dev user not found. Run the seed script first."
        });
        return;
    }

    const uploadResult = await createUpload({
        userId: devUser.id,
        file: uploadedFile,
        saveProfileName: saveProfileName || undefined,
        saveProfileId: saveProfileId || undefined
    });

    response.status(201).json(uploadResult);
};