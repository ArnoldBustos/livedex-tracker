import { Router } from "express";
import { getDexBySaveProfileId, getDexTemplate, patchDexEntryBySaveProfileId } from "./dex.controller";

const dexRouter = Router();

dexRouter.get("/template", getDexTemplate);
dexRouter.get("/profile/:saveProfileId", getDexBySaveProfileId);
dexRouter.patch("/profile/:saveProfileId/entry/:pokemonSpeciesId", patchDexEntryBySaveProfileId);

export default dexRouter;
