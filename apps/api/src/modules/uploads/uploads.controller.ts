import type { Request, Response } from "express";
import prismaClient from "../../lib/prisma";
import {
    createUpload,
    getSaveProfileDetails,
    listSaveProfiles
} from "./uploads.service";

const getDevUserId = async () => {
    const devUser = await prismaClient.user.findUnique({
        where: {
            email: "dev@example.com"
        },
        select: {
            id: true
        }
    });

    return devUser ? devUser.id : null;
};

export const getSaveProfiles = async (_request: Request, response: Response) => {
    const devUserId = await getDevUserId();

    if (!devUserId) {
        response.status(500).json({
            error: "Dev user not found. Run the seed script first."
        });
        return;
    }

    const saveProfiles = await listSaveProfiles({
        userId: devUserId
    });

    response.status(200).json(saveProfiles);
};

export const getSaveProfileById = async (request: Request, response: Response) => {
    const devUserId = await getDevUserId();

    if (!devUserId) {
        response.status(500).json({
            error: "Dev user not found. Run the seed script first."
        });
        return;
    }

    const saveProfileId =
        typeof request.params.saveProfileId === "string"
            ? request.params.saveProfileId.trim()
            : "";

    if (!saveProfileId) {
        response.status(400).json({
            error: "Save profile id is required"
        });
        return;
    }

    try {
        const saveProfileDetails = await getSaveProfileDetails({
            userId: devUserId,
            saveProfileId
        });

        response.status(200).json(saveProfileDetails);
    } catch (error) {
        response.status(404).json({
            error: error instanceof Error ? error.message : "Save profile not found"
        });
    }
};

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

    const devUserId = await getDevUserId();

    if (!devUserId) {
        response.status(500).json({
            error: "Dev user not found. Run the seed script first."
        });
        return;
    }

    const uploadResult = await createUpload({
        userId: devUserId,
        file: uploadedFile,
        saveProfileName: saveProfileName || undefined,
        saveProfileId: saveProfileId || undefined
    });

    response.status(201).json(uploadResult);
};