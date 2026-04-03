import { Router } from "express";
import { getDexBySaveProfileId } from "./dex.controller";

const dexRouter = Router();

dexRouter.get("/profile/:saveProfileId", getDexBySaveProfileId);

export default dexRouter;