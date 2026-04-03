import { Router } from "express";
import multer from "multer";
import {
    deleteSaveProfileById,
    getSaveProfileById,
    getSaveProfiles,
    uploadSaveFile
} from "./uploads.controller";

const uploadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

uploadsRouter.get("/profiles", getSaveProfiles);
uploadsRouter.get("/profiles/:saveProfileId", getSaveProfileById);
uploadsRouter.delete("/profiles/:saveProfileId", deleteSaveProfileById);
uploadsRouter.post("/", upload.single("saveFile"), uploadSaveFile);

export default uploadsRouter;