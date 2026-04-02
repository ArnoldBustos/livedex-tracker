import type { Request, Response, NextFunction } from "express";
import { getUserDex } from "./dex.service";

export const getDexByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;

        if (typeof userId !== "string") {
            return res.status(400).json({
                error: "Invalid userId"
            });
        }

        const dexData = await getUserDex(userId);

        return res.status(200).json(dexData);
    } catch (error) {
        return next(error);
    }
};