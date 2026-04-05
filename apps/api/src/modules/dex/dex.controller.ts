import type { Request, Response, NextFunction } from "express";
import { resolveRequestUserId } from "../auth/requestUser.service";
import { getEmptyDex, getOwnedSaveProfileDex, updateSaveProfileDexOverride } from "./dex.service";

type DexOverrideRequestBody = {
    seen?: boolean | null;
    caught?: boolean | null;
    hasLivingEntry?: boolean | null;
};

// getTrimmedRouteParam normalizes one required string route param from the request.
// dex controllers use this to keep route validation consistent across endpoints.
const getTrimmedRouteParam = (request: Request, paramName: string) => {
    const paramValue = request.params[paramName];

    if (typeof paramValue !== "string") {
        return "";
    }

    return paramValue.trim();
};

// parsePokemonSpeciesId reads the route species id as a positive integer.
// patchDexEntryBySaveProfileId uses this before writing a manual override row.
const parsePokemonSpeciesId = (request: Request) => {
    const rawPokemonSpeciesId = getTrimmedRouteParam(request, "pokemonSpeciesId");

    if (!rawPokemonSpeciesId) {
        return null;
    }

    const pokemonSpeciesId = Number(rawPokemonSpeciesId);

    if (!Number.isInteger(pokemonSpeciesId) || pokemonSpeciesId <= 0) {
        return null;
    }

    return pokemonSpeciesId;
};

// parseDexOverrideRequestBody validates manual override fields from the PATCH body.
// patchDexEntryBySaveProfileId uses this to support boolean writes and null clears per field.
const parseDexOverrideRequestBody = (request: Request): DexOverrideRequestBody | null => {
    const requestBodyValue = request.body;
    const allowedFieldNames = ["seen", "caught", "hasLivingEntry"];
    const parsedBody: DexOverrideRequestBody = {};
    let hasAtLeastOneField = false;

    if (!requestBodyValue || typeof requestBodyValue !== "object" || Array.isArray(requestBodyValue)) {
        return null;
    }

    const requestBody = requestBodyValue as Record<string, unknown>;

    for (const fieldName of allowedFieldNames) {
        if (!Object.prototype.hasOwnProperty.call(requestBody, fieldName)) {
            continue;
        }

        hasAtLeastOneField = true;

        const fieldValue = requestBody[fieldName];

        if (fieldValue !== null && typeof fieldValue !== "boolean") {
            return null;
        }

        if (fieldName === "seen") {
            parsedBody.seen = fieldValue as boolean | null;
        }

        if (fieldName === "caught") {
            parsedBody.caught = fieldValue as boolean | null;
        }

        if (fieldName === "hasLivingEntry") {
            parsedBody.hasLivingEntry = fieldValue as boolean | null;
        }
    }

    return hasAtLeastOneField ? parsedBody : null;
};

// getDexBySaveProfileId returns the resolved dex payload for one save profile.
// dex.routes.ts uses this for read requests from the dashboard.
export const getDexBySaveProfileId = async (
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const saveProfileId = getTrimmedRouteParam(req, "saveProfileId");

    if (!saveProfileId) {
        return res.status(400).json({
            error: "Invalid saveProfileId"
        });
    }

    const userId = await resolveRequestUserId(req);

    if (!userId) {
        return res.status(500).json({
            error: "No request user found. Run the seed script first."
        });
    }

    try {
        const dexData = await getOwnedSaveProfileDex({
            userId,
            saveProfileId
        });

        return res.status(200).json(dexData);
    } catch (error) {
        return res.status(404).json({
            error: error instanceof Error ? error.message : "Save profile not found"
        });
    }
};

// getDexTemplate returns the blank dex payload used by manual save setup flows.
// dex.routes.ts exposes this so the frontend can create local manual shells without duplicating species data.
export const getDexTemplate = async (
    _request: Request,
    response: Response
) => {
    try {
        const dexTemplate = await getEmptyDex();
        response.status(200).json(dexTemplate);
    } catch (error) {
        response.status(500).json({
            error: error instanceof Error ? error.message : "Failed to load dex template"
        });
    }
};

// patchDexEntryBySaveProfileId updates one signed-in manual dex override for a save profile.
// dex.routes.ts uses this to keep manual edit writes inside the dex module.
export const patchDexEntryBySaveProfileId = async (
    request: Request,
    response: Response
) => {
    const saveProfileId = getTrimmedRouteParam(request, "saveProfileId");
    const pokemonSpeciesId = parsePokemonSpeciesId(request);
    const overridePatch = parseDexOverrideRequestBody(request);

    if (!saveProfileId) {
        response.status(400).json({
            error: "Save profile id is required"
        });
        return;
    }

    if (pokemonSpeciesId === null) {
        response.status(400).json({
            error: "Pokemon species id must be a positive integer"
        });
        return;
    }

    if (!overridePatch) {
        response.status(400).json({
            error: "Request body must include seen, caught, or hasLivingEntry as boolean or null"
        });
        return;
    }

    if (request.user && request.user.id === "guest") {
        response.status(403).json({
            error: "Guest dex overrides stay in frontend session state"
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

    try {
        const dexData = await updateSaveProfileDexOverride({
            userId,
            saveProfileId,
            pokemonSpeciesId,
            overridePatch
        });

        response.status(200).json(dexData);
    } catch (error) {
        response.status(404).json({
            error: error instanceof Error ? error.message : "Dex override update failed"
        });
    }
};
