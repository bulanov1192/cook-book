import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { recipeComments } from "../../db/schema.js";
import type {
  CreateRecipeCommentInput,
  UpdateRecipeCommentInput
} from "./recipe-comment.schemas.js";

function nowIsoString(): string {
  return new Date().toISOString();
}

export async function listRecipeComments(recipeId: string, limit: number, offset: number) {
  const [totalRow] = await db
    .select({ total: count() })
    .from(recipeComments)
    .where(eq(recipeComments.recipeId, recipeId));

  const items = await db.query.recipeComments.findMany({
    where: eq(recipeComments.recipeId, recipeId),
    with: {
      author: true
    },
    orderBy: [desc(recipeComments.createdAt)],
    limit,
    offset
  });

  return {
    items,
    total: totalRow?.total ?? 0
  };
}

export async function getRecipeCommentById(commentId: string) {
  return db.query.recipeComments.findFirst({
    where: eq(recipeComments.id, commentId),
    with: {
      author: true
    }
  });
}

export async function listRecipeCommentCounts(recipeIds: string[]) {
  if (!recipeIds.length) {
    return [];
  }

  return db
    .select({
      recipeId: recipeComments.recipeId,
      total: count()
    })
    .from(recipeComments)
    .where(inArray(recipeComments.recipeId, recipeIds))
    .groupBy(recipeComments.recipeId);
}

export async function createRecipeComment(
  recipeId: string,
  authorId: string,
  input: CreateRecipeCommentInput
) {
  const timestamp = nowIsoString();
  const commentId = crypto.randomUUID();

  await db.insert(recipeComments).values({
    id: commentId,
    recipeId,
    authorId,
    body: input.body,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return getRecipeCommentById(commentId);
}

export async function updateRecipeComment(commentId: string, input: UpdateRecipeCommentInput) {
  await db
    .update(recipeComments)
    .set({
      body: input.body,
      updatedAt: nowIsoString()
    })
    .where(eq(recipeComments.id, commentId));

  return getRecipeCommentById(commentId);
}

export async function deleteRecipeComment(commentId: string) {
  await db.delete(recipeComments).where(eq(recipeComments.id, commentId));
}
