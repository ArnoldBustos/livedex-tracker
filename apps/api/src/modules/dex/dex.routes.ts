import { Router } from "express";
import { getDexBySaveProfileId, patchDexEntryBySaveProfileId } from "./dex.controller";

const dexRouter = Router();

dexRouter.get("/profile/:saveProfileId", getDexBySaveProfileId);
dexRouter.patch("/profile/:saveProfileId/entry/:pokemonSpeciesId", patchDexEntryBySaveProfileId);

export default dexRouter;
