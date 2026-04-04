import { Router } from "express";
import { loginWithEmail } from "./auth.controller";

const authRouter = Router();

authRouter.post("/login", loginWithEmail);

export default authRouter;