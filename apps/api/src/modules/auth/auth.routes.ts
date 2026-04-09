import { Router } from "express";
import {
    getCurrentSession,
    signInWithEmailPassword,
    signOutCurrentSession,
    signUpWithEmailPassword
} from "./auth.controller";

const authRouter = Router();

authRouter.get("/session", getCurrentSession);
authRouter.post("/sign-in", signInWithEmailPassword);
authRouter.post("/sign-out", signOutCurrentSession);
authRouter.post("/sign-up", signUpWithEmailPassword);

export default authRouter;
