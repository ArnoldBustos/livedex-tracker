import { Router } from "express";
import { getDexByUserId } from "./dex.controller";

const dexRouter = Router();

dexRouter.get("/:userId", getDexByUserId);

export default dexRouter;