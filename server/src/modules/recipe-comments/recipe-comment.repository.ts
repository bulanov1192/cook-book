import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { recipeComments } from "../../db/schema.js";
import type { UpdateRecipeCommentInput } from "./recipe-comment.schemas.js";

function nowIsoString(): string {
  return new Date().toISOString();
}

export async function listRecipeComments(recipeId: string, limit: number, offset: number) {
  const [totalRow] = await db
    .select({ total: count() })
    .from(recipeComments)
    .where(and(eq(recipeComments.recipeId, recipeId), isNull(recipeComments.parentCommentId)));

  const items = await db.query.recipeComments.findMany({
    where: and(eq(recipeComments.recipeId, recipeId), isNull(recipeComments.parentCommentId)),
    with: {
      author: true
    },
    orderBy: [asc(recipeComments.createdAt)],
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

export async function listRecipeCommentReplies(
  recipeId: string,
  parentCommentId: string,
  limit: number,
  offset: number
) {
  const items = await db.query.recipeComments.findMany({
    where: and(
      eq(recipeComments.recipeId, recipeId),
      eq(recipeComments.parentCommentId, parentCommentId)
    ),
    with: {
      author: true
    },
    orderBy: [asc(recipeComments.createdAt)],
    limit,
    offset
  });

  return { items };
}

export async function listRecipeCommentsByParentIds(recipeId: string, parentCommentIds: string[]) {
  if (!parentCommentIds.length) {
    return [];
  }

  return db.query.recipeComments.findMany({
    where: and(
      eq(recipeComments.recipeId, recipeId),
      inArray(recipeComments.parentCommentId, parentCommentIds)
    ),
    with: {
      author: true
    },
    orderBy: [asc(recipeComments.createdAt)]
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
  input: {
    id: string;
    recipeId: string;
    authorId: string;
    body: string;
    parentCommentId: string | null;
    rootCommentId: string;
    depth: number;
    createdAt: string;
    updatedAt: string;
  }
) {
  await db.insert(recipeComments).values({
    id: input.id,
    recipeId: input.recipeId,
    authorId: input.authorId,
    parentCommentId: input.parentCommentId,
    rootCommentId: input.rootCommentId,
    depth: input.depth,
    body: input.body,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  });

  return getRecipeCommentById(input.id);
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
  await db
    .update(recipeComments)
    .set({
      body: "",
      deletedAt: nowIsoString(),
      updatedAt: nowIsoString()
    })
    .where(eq(recipeComments.id, commentId));

  return getRecipeCommentById(commentId);
}

export async function incrementRecipeCommentReplyCount(commentId: string) {
  await db
    .update(recipeComments)
    .set({
      replyCount: sql`${recipeComments.replyCount} + 1`
    })
    .where(eq(recipeComments.id, commentId));
}
