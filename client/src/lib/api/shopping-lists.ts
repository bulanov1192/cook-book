import { loadRequest, request } from "./http";
import type {
  ShoppingList,
  ShoppingListItemPayload,
  ShoppingListListResponse,
  ShoppingListVisibility
} from "./types";

export async function listShoppingLists(fetcher: typeof fetch) {
  return loadRequest<ShoppingListListResponse>(fetcher, "/api/shopping-lists");
}

export async function getShoppingList(fetcher: typeof fetch, id: string) {
  return loadRequest<ShoppingList>(fetcher, `/api/shopping-lists/${id}`);
}

export async function createShoppingList(name: string, visibility: ShoppingListVisibility) {
  return request<ShoppingList>("/api/shopping-lists", {
    method: "POST",
    body: JSON.stringify({ name, visibility })
  });
}

export async function addShoppingListItem(listId: string, payload: ShoppingListItemPayload) {
  return request<ShoppingList>(`/api/shopping-lists/${listId}/items`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  payload: Partial<ShoppingListItemPayload>
) {
  return request<ShoppingList>(`/api/shopping-lists/${listId}/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteShoppingListItem(listId: string, itemId: string) {
  return request<ShoppingList>(`/api/shopping-lists/${listId}/items/${itemId}`, {
    method: "DELETE"
  });
}

export async function importRecipeToShoppingList(listId: string, recipeId: string) {
  return request<ShoppingList>(`/api/shopping-lists/${listId}/import-recipe`, {
    method: "POST",
    body: JSON.stringify({ recipeId })
  });
}
