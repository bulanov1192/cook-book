import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { recipeVoteSummaries, recipeVotes } from "../../db/schema.js";
import type { RecipeVoteValue } from "./recipe-vote.schemas.js";

function nowIsoString(): string {
  return new Date().toISOString();
}

export async function getCurrentUserVoteForRecipe(recipeId: string, userId: string) {
  return db.query.recipeVotes.findFirst({
    where: and(eq(recipeVotes.recipeId, recipeId), eq(recipeVotes.userId, userId))
  });
}

export async function listCurrentUserVotesForRecipes(recipeIds: string[], userId: string) {
  if (!recipeIds.length) {
    return [];
  }

  return db
    .select({
      recipeId: recipeVotes.recipeId,
      value: recipeVotes.value
    })
    .from(recipeVotes)
    .where(and(inArray(recipeVotes.recipeId, recipeIds), eq(recipeVotes.userId, userId)));
}

export async function listVoteSummariesForRecipes(recipeIds: string[]) {
  if (!recipeIds.length) {
    return [];
  }

  return db
    .select()
    .from(recipeVoteSummaries)
    .where(inArray(recipeVoteSummaries.recipeId, recipeIds));
}

export async function setRecipeVote(recipeId: string, userId: string, value: RecipeVoteValue) {
  const existingVote = await getCurrentUserVoteForRecipe(recipeId, userId);
  const timestamp = nowIsoString();

  if (existingVote) {
    await db
      .update(recipeVotes)
      .set({
        value,
        updatedAt: timestamp
      })
      .where(eq(recipeVotes.id, existingVote.id));
  } else {
    await db.insert(recipeVotes).values({
      id: crypto.randomUUID(),
      recipeId,
      userId,
      value,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  await refreshRecipeVoteSummary(recipeId);
  return getVoteSummaryByRecipeId(recipeId);
}

export async function clearRecipeVote(recipeId: string, userId: string) {
  await db
    .delete(recipeVotes)
    .where(and(eq(recipeVotes.recipeId, recipeId), eq(recipeVotes.userId, userId)));

  await refreshRecipeVoteSummary(recipeId);
  return getVoteSummaryByRecipeId(recipeId);
}

export async function getVoteSummaryByRecipeId(recipeId: string) {
  return db.query.recipeVoteSummaries.findFirst({
    where: eq(recipeVoteSummaries.recipeId, recipeId)
  });
}

export async function refreshRecipeVoteSummary(recipeId: string) {
  const [row] = await db
    .select({
      upvoteCount: sql<number>`coalesce(sum(case when ${recipeVotes.value} = 'up' then 1 else 0 end), 0)`.mapWith(
        Number
      ),
      downvoteCount: sql<number>`coalesce(sum(case when ${recipeVotes.value} = 'down' then 1 else 0 end), 0)`.mapWith(
        Number
      )
    })
    .from(recipeVotes)
    .where(eq(recipeVotes.recipeId, recipeId));

  const upvoteCount = row?.upvoteCount ?? 0;
  const downvoteCount = row?.downvoteCount ?? 0;
  const score = upvoteCount - downvoteCount;

  if (!upvoteCount && !downvoteCount) {
    await db.delete(recipeVoteSummaries).where(eq(recipeVoteSummaries.recipeId, recipeId));
    return null;
  }

  await db
    .insert(recipeVoteSummaries)
    .values({
      recipeId,
      upvoteCount,
      downvoteCount,
      score,
      updatedAt: nowIsoString()
    })
    .onConflictDoUpdate({
      target: recipeVoteSummaries.recipeId,
      set: {
        upvoteCount,
        downvoteCount,
        score,
        updatedAt: nowIsoString()
      }
    });

  return getVoteSummaryByRecipeId(recipeId);
}
