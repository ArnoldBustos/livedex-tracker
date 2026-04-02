import cors from "cors";
import express from "express";
import healthRouter from "./modules/health/health.routes";
import uploadsRouter from "./modules/uploads/uploads.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/uploads", uploadsRouter);

export default app;