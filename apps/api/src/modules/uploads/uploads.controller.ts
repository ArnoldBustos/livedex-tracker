import type { Request, Response } from "express";
import { type ManualGen3GameOverride } from "../../../../../packages/shared/src";
import { resolveRequestUserId } from "../auth/requestUser.service";
import {
    createGuestUpload,
    createUpload,
    deleteSaveProfile,
    getIsSupportedGame,
    getIsManualGen3GameOverride,
    getSaveProfileDetails,
    updateSaveProfileMetadata,
    listSaveProfiles
} from "./uploads.service";

// getManualGameOverride reads and validates the optional FRLG override field from the multipart upload request.
const getManualGameOverride = (
    request: Request
): ManualGen3GameOverride | undefined => {
    const rawManualGameOverride =
        typeof request.body.manualGameOverride === "string"
            ? request.body.manualGameOverride.trim()
            : "";

    if (!rawManualGameOverride) {
        return undefined;
    }

    if (!getIsManualGen3GameOverride(rawManualGameOverride)) {
        throw new Error("manualGameOverride must be FIRERED or LEAFGREEN when provided");
    }

    return rawManualGameOverride;
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

// patchSaveProfileById updates one saved profile's editable name and game metadata.
// the dashboard edit dialog calls this endpoint after the user changes profile details.
export const patchSaveProfileById = async (request: Request, response: Response) => {
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
    const name =
        typeof request.body.name === "string"
            ? request.body.name.trim()
            : "";
    const rawGame =
        typeof request.body.game === "string"
            ? request.body.game.trim()
            : request.body.game === null
                ? null
                : "";

    if (!saveProfileId) {
        response.status(400).json({
            error: "Save profile id is required"
        });
        return;
    }

    if (!name) {
        response.status(400).json({
            error: "Save profile name is required"
        });
        return;
    }

    if (typeof rawGame === "string" && rawGame && !getIsSupportedGame(rawGame)) {
        response.status(400).json({
            error: "Game must be one of the supported titles or null"
        });
        return;
    }

    try {
        const updatedSaveProfile = await updateSaveProfileMetadata({
            userId,
            saveProfileId,
            name,
            game: typeof rawGame === "string" ? rawGame || null : rawGame
        });

        response.status(200).json(updatedSaveProfile);
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
    let manualGameOverride: ManualGen3GameOverride | undefined;

    if (!uploadedFile) {
        response.status(400).json({
            error: "No file uploaded"
        });
        return;
    }

    try {
        manualGameOverride = getManualGameOverride(request);
    } catch (error) {
        response.status(400).json({
            error: error instanceof Error ? error.message : "Invalid manual game override"
        });
        return;
    }

    const isGuestRequest = request.user ? request.user.id === "guest" : false;

    try {
        if (isGuestRequest) {
            const guestUploadResult = await createGuestUpload({
                file: uploadedFile,
                saveProfileName: saveProfileName || undefined,
                manualGameOverride
            });

            response.status(
                guestUploadResult.status === "completed" ? 201 : 200
            ).json(guestUploadResult);
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
            saveProfileId: saveProfileId || undefined,
            manualGameOverride
        });

        response.status(
            uploadResult.status === "completed" ? 201 : 200
        ).json(uploadResult);
    } catch (error) {
        response.status(500).json({
            error: error instanceof Error ? error.message : "Upload failed"
        });
    }
};
