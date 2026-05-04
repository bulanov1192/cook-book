import { buildQuery, loadRequest, request } from "./http";
import type {
  CategoryListResponse,
  Recipe,
  RecipeListResponse,
  RecipePayload,
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
