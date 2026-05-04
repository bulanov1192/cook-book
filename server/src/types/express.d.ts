import type { AccessContext } from "../auth/access.js";

declare global {
  namespace Express {
    interface Request {
      auth: AccessContext;
    }
  }
}

export {};
