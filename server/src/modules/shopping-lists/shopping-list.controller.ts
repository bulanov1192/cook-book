import type { Request, Response } from "express";
import {
  createShoppingListItemSchema,
  createShoppingListSchema,
  importRecipeIntoShoppingListSchema,
  shoppingListIdParamsSchema,
  shoppingListItemIdParamsSchema,
  updateShoppingListItemSchema
} from "./shopping-list.schemas.js";
import {
  addShoppingListItemEntry,
  createShoppingListEntry,
  deleteShoppingListItemEntry,
  getShoppingListOrThrow,
  getShoppingLists,
  importRecipeIntoShoppingList,
  updateShoppingListItemEntry
} from "./shopping-list.service.js";

export async function listShoppingListsHandler(request: Request, response: Response) {
  response.json(await getShoppingLists(request.auth));
}

export async function getShoppingListHandler(request: Request, response: Response) {
  const { id } = shoppingListIdParamsSchema.parse(request.params);
  response.json(await getShoppingListOrThrow(id, request.auth));
}

export async function createShoppingListHandler(request: Request, response: Response) {
  const input = createShoppingListSchema.parse(request.body);
  response.status(201).json(await createShoppingListEntry(input, request.auth));
}

export async function addShoppingListItemHandler(request: Request, response: Response) {
  const { id } = shoppingListIdParamsSchema.parse(request.params);
  const input = createShoppingListItemSchema.parse(request.body);
  response.json(await addShoppingListItemEntry(id, input, request.auth));
}

export async function updateShoppingListItemHandler(request: Request, response: Response) {
  const { id, itemId } = shoppingListItemIdParamsSchema.parse(request.params);
  const input = updateShoppingListItemSchema.parse(request.body);
  response.json(await updateShoppingListItemEntry(id, itemId, input, request.auth));
}

export async function deleteShoppingListItemHandler(request: Request, response: Response) {
  const { id, itemId } = shoppingListItemIdParamsSchema.parse(request.params);
  response.json(await deleteShoppingListItemEntry(id, itemId, request.auth));
}

export async function importRecipeIntoShoppingListHandler(request: Request, response: Response) {
  const { id } = shoppingListIdParamsSchema.parse(request.params);
  const { recipeId } = importRecipeIntoShoppingListSchema.parse(request.body);
  response.json(await importRecipeIntoShoppingList(id, recipeId, request.auth));
}
