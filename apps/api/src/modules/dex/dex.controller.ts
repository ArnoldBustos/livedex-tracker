import type { Request, Response, NextFunction } from "express";
import { getSaveProfileDex } from "./dex.service";

export const getDexBySaveProfileId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { saveProfileId } = req.params;

        if (typeof saveProfileId !== "string") {
            return res.status(400).json({
                error: "Invalid saveProfileId"
            });
        }

        const dexData = await getSaveProfileDex(saveProfileId);

        return res.status(200).json(dexData);
    } catch (error) {
        return next(error);
    }
};