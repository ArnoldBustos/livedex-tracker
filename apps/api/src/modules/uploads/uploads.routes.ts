import { Router } from "express";
import multer from "multer";
import { uploadSaveFile } from "./uploads.controller";

const uploadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

uploadsRouter.post("/", upload.single("saveFile"), uploadSaveFile);

export default uploadsRouter;