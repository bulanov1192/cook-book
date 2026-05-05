import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireAuthenticated } from "./access.js";
import { db } from "../db/client.js";
import { user } from "../db/schema.js";

const updatePreferencesSchema = z.object({
  locale: z.enum(["en", "ru"])
});

export async function getSessionHandler(request: Request, response: Response) {
  let locale: "en" | "ru" | undefined;

  if (request.auth.userId) {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, request.auth.userId)
    });

    locale = currentUser?.locale ?? "en";
  }

  response.json({
    session: request.auth.sessionId
      ? {
          id: request.auth.sessionId
        }
      : null,
    user: request.auth.user
      ? {
          ...request.auth.user,
          locale: locale ?? "en"
        }
      : null,
    isAuthenticated: request.auth.role !== "anonymous"
  });
}

export async function updatePreferencesHandler(request: Request, response: Response) {
  const access = requireAuthenticated(request.auth, "Sign in to update your preferences");
  const input = updatePreferencesSchema.parse(request.body);

  await db
    .update(user)
    .set({
      locale: input.locale
    })
    .where(eq(user.id, access.userId));

  response.json({
    ok: true,
    preferences: {
      locale: input.locale
    }
  });
}
