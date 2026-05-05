import { requireAuthenticated, type AccessContext } from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";
import { ensureRecipeReadable } from "../recipes/recipe.access.js";
import { getRecipeById } from "../recipes/recipe.repository.js";
import type { RecipeVoteSummaryDto } from "../recipes/recipe.types.js";
import {
  clearRecipeVote,
  getCurrentUserVoteForRecipe,
  getVoteSummaryByRecipeId,
  listCurrentUserVotesForRecipes,
  listVoteSummariesForRecipes,
  setRecipeVote
} from "./recipe-vote.repository.js";
import type { RecipeVoteValue } from "./recipe-vote.schemas.js";

function toVoteSummaryDto(
  summary:
    | {
        upvoteCount: number;
        downvoteCount: number;
        score: number;
      }
    | null
    | undefined,
  currentUserVote: RecipeVoteValue | null
): RecipeVoteSummaryDto {
  return {
    upvoteCount: summary?.upvoteCount ?? 0,
    downvoteCount: summary?.downvoteCount ?? 0,
    score: summary?.score ?? 0,
    currentUserVote
  };
}

export async function getRecipeVoteSummary(recipeId: string, access: AccessContext) {
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  ensureRecipeReadable(recipe, access);

  const summary = await getVoteSummaryByRecipeId(recipeId);
  const currentUserVote =
    access.userId ? (await getCurrentUserVoteForRecipe(recipeId, access.userId))?.value ?? null : null;

  return toVoteSummaryDto(summary, currentUserVote);
}

export async function setRecipeVoteEntry(
  recipeId: string,
  value: RecipeVoteValue,
  access: AccessContext
) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to vote for recipes");
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  ensureRecipeReadable(recipe, authenticatedAccess);

  const summary = await setRecipeVote(recipeId, authenticatedAccess.userId, value);
  return toVoteSummaryDto(summary, value);
}

export async function clearRecipeVoteEntry(recipeId: string, access: AccessContext) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to update your vote");
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  ensureRecipeReadable(recipe, authenticatedAccess);

  const summary = await clearRecipeVote(recipeId, authenticatedAccess.userId);
  return toVoteSummaryDto(summary, null);
}

export async function attachVoteSummariesToRecipes<
  T extends {
    id: string;
    vote: RecipeVoteSummaryDto;
  }
>(recipes: T[], access: AccessContext): Promise<T[]> {
  if (!recipes.length) {
    return recipes;
  }

  const recipeIds = recipes.map((recipe) => recipe.id);
  const summaries = await listVoteSummariesForRecipes(recipeIds);
  const currentUserVotes =
    access.userId ? await listCurrentUserVotesForRecipes(recipeIds, access.userId) : [];

  const summariesByRecipeId = new Map(summaries.map((summary) => [summary.recipeId, summary]));
  const votesByRecipeId = new Map(currentUserVotes.map((vote) => [vote.recipeId, vote.value as RecipeVoteValue]));

  return recipes.map((recipe) => ({
    ...recipe,
    vote: toVoteSummaryDto(
      summariesByRecipeId.get(recipe.id),
      votesByRecipeId.get(recipe.id) ?? null
    )
  }));
}
