import type { Request, Response } from "express";

export async function getSessionHandler(request: Request, response: Response) {
  response.json({
    session: request.auth.sessionId
      ? {
          id: request.auth.sessionId
        }
      : null,
    user: request.auth.user,
    isAuthenticated: request.auth.role !== "anonymous"
  });
}
