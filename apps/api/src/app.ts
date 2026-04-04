import cors from "cors";
import express from "express";
import { attachRequestUser } from "./middleware/auth";
import authRouter from "./modules/auth/auth.routes";
import dexRouter from "./modules/dex/dex.routes";
import healthRouter from "./modules/health/health.routes";
import uploadsRouter from "./modules/uploads/uploads.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(attachRequestUser);

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/uploads", uploadsRouter);
app.use("/dex", dexRouter);

export default app;