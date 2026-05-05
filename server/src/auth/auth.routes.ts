import { Router } from "express";
import { asyncHandler } from "../shared/http/async-handler.js";
import { getSessionHandler, updatePreferencesHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.get("/session", asyncHandler(getSessionHandler));
authRouter.patch("/profile/preferences", asyncHandler(updatePreferencesHandler));
