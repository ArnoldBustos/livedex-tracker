import { Router } from "express";
import multer from "multer";
import { getSaveProfiles, uploadSaveFile } from "./uploads.controller";

const uploadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

uploadsRouter.get("/profiles", getSaveProfiles);
uploadsRouter.post("/", upload.single("saveFile"), uploadSaveFile);

export default uploadsRouter;