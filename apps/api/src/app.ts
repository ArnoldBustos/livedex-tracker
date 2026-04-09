import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env";
import { attachRequestUser } from "./middleware/auth";
import { auth } from "./modules/auth/betterAuth";
import authRouter from "./modules/auth/auth.routes";
import dexRouter from "./modules/dex/dex.routes";
import healthRouter from "./modules/health/health.routes";
import uploadsRouter from "./modules/uploads/uploads.routes";

const app = express();

app.use(cors({
    origin: env.WEB_ORIGIN,
    credentials: true
}));
app.all("/api/auth", toNodeHandler(auth));
app.all("/api/auth/{*authPath}", toNodeHandler(auth));
app.use(express.json());
app.use(attachRequestUser);

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/uploads", uploadsRouter);
app.use("/dex", dexRouter);

export default app;
