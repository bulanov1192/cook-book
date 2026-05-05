import { buildQuery, loadRequest, request } from "./http";
import type {
  CategoryListResponse,
  RecipeComment,
  RecipeCommentListResponse,
  RecipeCommentPayload,
  Recipe,
  RecipeListResponse,
  RecipePayload,
  RecipeVotePayload,
  RecipeVoteSummary,
  TagListResponse
} from "./types";

export function getRecipesPath(params: Record<string, string | number | undefined>) {
  return `/api/recipes${buildQuery(params)}`;
}

export async function listRecipes(fetcher: typeof fetch, params: Record<string, string | number | undefined>) {
  return loadRequest<RecipeListResponse>(fetcher, getRecipesPath(params));
}

export async function getRecipe(fetcher: typeof fetch, id: string) {
  return loadRequest<Recipe>(fetcher, `/api/recipes/${id}`);
}

export async function getRecipeComments(
  fetcher: typeof fetch,
  id: string,
  params: Record<string, string | number | undefined>
) {
  return loadRequest<RecipeCommentListResponse>(fetcher, `/api/recipes/${id}/comments${buildQuery(params)}`);
}

export async function getRecipeCommentReplies(
  fetcher: typeof fetch,
  recipeId: string,
  commentId: string,
  params: Record<string, string | number | undefined>
) {
  return loadRequest<RecipeCommentListResponse>(
    fetcher,
    `/api/recipes/${recipeId}/comments/${commentId}/replies${buildQuery(params)}`
  );
}

export async function getRecipeVote(fetcher: typeof fetch, id: string) {
  return loadRequest<RecipeVoteSummary>(fetcher, `/api/recipes/${id}/vote`);
}

export async function getRecipeCategories(fetcher: typeof fetch) {
  return loadRequest<CategoryListResponse>(fetcher, "/api/recipes/categories");
}

export async function getRecipeTags(fetcher: typeof fetch) {
  return loadRequest<TagListResponse>(fetcher, "/api/recipes/tags");
}

export async function createRecipe(payload: RecipePayload) {
  return request<Recipe>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateRecipe(id: string, payload: Partial<RecipePayload>) {
  return request<Recipe>(`/api/recipes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function archiveRecipe(id: string) {
  return request<Recipe>(`/api/recipes/${id}/archive`, {
    method: "POST"
  });
}

export async function restoreRecipe(id: string) {
  return request<Recipe>(`/api/recipes/${id}/restore`, {
    method: "POST"
  });
}

export async function createRecipeComment(id: string, payload: RecipeCommentPayload) {
  return request<RecipeComment>(`/api/recipes/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateRecipeComment(
  recipeId: string,
  commentId: string,
  payload: RecipeCommentPayload
) {
  return request<RecipeComment>(`/api/recipes/${recipeId}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteRecipeComment(recipeId: string, commentId: string) {
  return request<RecipeComment>(`/api/recipes/${recipeId}/comments/${commentId}`, {
    method: "DELETE"
  });
}

export async function setRecipeVote(recipeId: string, payload: RecipeVotePayload) {
  return request<RecipeVoteSummary>(`/api/recipes/${recipeId}/vote`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function clearRecipeVote(recipeId: string) {
  return request<RecipeVoteSummary>(`/api/recipes/${recipeId}/vote`, {
    method: "DELETE"
  });
}
