import type { Request, Response } from "express";
import prismaClient from "../../lib/prisma";
import {
    createUpload,
    deleteSaveProfile,
    getSaveProfileDetails,
    listSaveProfiles
} from "./uploads.service";

// getDevUserId returns the seeded development user id for local development fallback
// resolveRequestUserId calls this only when no authenticated user is attached to the request yet
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

// resolveRequestUserId returns the authenticated request user when present
// local development still falls back to the seeded dev user until full auth is wired in
const resolveRequestUserId = async (request: Request) => {
    if (request.user && request.user.id) {
        return request.user.id;
    }

    return await getDevUserId();
};

// getSaveProfiles returns all save profiles for the current request user
// the uploads routes call this to populate the profile list in the frontend
export const getSaveProfiles = async (request: Request, response: Response) => {
    const userId = await resolveRequestUserId(request);

    if (!userId) {
        response.status(500).json({
            error: "No request user found. Run the seed script first."
        });
        return;
    }

    const saveProfiles = await listSaveProfiles({
        userId
    });

    response.status(200).json(saveProfiles);
};

// deleteSaveProfileById deletes one save profile owned by the current request user
// the profile delete action in the frontend calls this endpoint
export const deleteSaveProfileById = async (request: Request, response: Response) => {
    const userId = await resolveRequestUserId(request);

    if (!userId) {
        response.status(500).json({
            error: "No request user found. Run the seed script first."
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
        const deleteResult = await deleteSaveProfile({
            userId,
            saveProfileId
        });

        response.status(200).json(deleteResult);
    } catch (error) {
        response.status(404).json({
            error: error instanceof Error ? error.message : "Save profile not found"
        });
    }
};

// getSaveProfileById returns one save profile owned by the current request user
// the frontend uses this when switching between saved profiles
export const getSaveProfileById = async (request: Request, response: Response) => {
    const userId = await resolveRequestUserId(request);

    if (!userId) {
        response.status(500).json({
            error: "No request user found. Run the seed script first."
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
            userId,
            saveProfileId
        });

        response.status(200).json(saveProfileDetails);
    } catch (error) {
        response.status(404).json({
            error: error instanceof Error ? error.message : "Save profile not found"
        });
    }
};

// uploadSaveFile creates or updates a save upload for the current request user
// the upload form in the frontend posts the save file to this controller
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

    const userId = await resolveRequestUserId(request);

    if (!userId) {
        response.status(500).json({
            error: "No request user found. Run the seed script first."
        });
        return;
    }

    const uploadResult = await createUpload({
        userId,
        file: uploadedFile,
        saveProfileName: saveProfileName || undefined,
        saveProfileId: saveProfileId || undefined
    });

    response.status(201).json(uploadResult);
};