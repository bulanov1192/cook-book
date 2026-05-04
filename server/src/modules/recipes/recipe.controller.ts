import type { Request, Response } from "express";
import {
  createRecipeSchema,
  listRecipesQuerySchema,
  recipeIdParamsSchema,
  updateRecipeSchema
} from "./recipe.schemas.js";
import {
  archiveRecipeEntry,
  createRecipeEntry,
  getRecipeCategories,
  getRecipeOrThrow,
  getRecipeTags,
  getRecipes,
  restoreRecipeEntry,
  updateRecipeEntry
} from "./recipe.service.js";

export async function listRecipesHandler(request: Request, response: Response) {
  const query = listRecipesQuerySchema.parse(request.query);
  const result = await getRecipes(query, request.auth);
  response.json(result);
}

export async function getRecipeHandler(request: Request, response: Response) {
  const { id } = recipeIdParamsSchema.parse(request.params);
  const recipe = await getRecipeOrThrow(id, request.auth);
  response.json(recipe);
}

export async function createRecipeHandler(request: Request, response: Response) {
  const input = createRecipeSchema.parse(request.body);
  const recipe = await createRecipeEntry(input, request.auth);
  response.status(201).json(recipe);
}

export async function updateRecipeHandler(request: Request, response: Response) {
  const { id } = recipeIdParamsSchema.parse(request.params);
  const input = updateRecipeSchema.parse(request.body);
  const recipe = await updateRecipeEntry(id, input, request.auth);
  response.json(recipe);
}

export async function archiveRecipeHandler(request: Request, response: Response) {
  const { id } = recipeIdParamsSchema.parse(request.params);
  const recipe = await archiveRecipeEntry(id, request.auth);
  response.json(recipe);
}

export async function restoreRecipeHandler(request: Request, response: Response) {
  const { id } = recipeIdParamsSchema.parse(request.params);
  const recipe = await restoreRecipeEntry(id, request.auth);
  response.json(recipe);
}

export async function listCategoriesHandler(request: Request, response: Response) {
  response.json(await getRecipeCategories(request.auth));
}

export async function listTagsHandler(request: Request, response: Response) {
  response.json(await getRecipeTags(request.auth));
}
