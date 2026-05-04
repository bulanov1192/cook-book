import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { toAccessContext, type SessionLike } from "./access.js";
import { env } from "../config/env.js";

export async function resolveSession(request: Request, _response: Response, next: NextFunction) {
  try {
    const session = (await auth.api.getSession({
      headers: fromNodeHeaders(request.headers)
    })) as SessionLike;

    request.auth = toAccessContext(session, env.ADMIN_EMAILS);
  } catch {
    request.auth = toAccessContext(null, env.ADMIN_EMAILS);
  }

  next();
}
