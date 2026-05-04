import {
  canManageOwnedEntity,
  requireAuthenticated,
  type AccessContext
} from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getRecipeById } from "../recipes/recipe.repository.js";
import { toShoppingListDto } from "./shopping-list.mapper.js";
import {
  addShoppingListItem,
  createShoppingList,
  deleteShoppingListItem,
  getShoppingListById,
  listShoppingLists,
  updateShoppingListItem
} from "./shopping-list.repository.js";
import type {
  CreateShoppingListInput,
  CreateShoppingListItemInput,
  UpdateShoppingListItemInput
} from "./shopping-list.schemas.js";

type ShoppingListRecord = NonNullable<Awaited<ReturnType<typeof getShoppingListById>>>;
type RecipeRecord = NonNullable<Awaited<ReturnType<typeof getRecipeById>>>;

function canReadShoppingList(
  list: Pick<ShoppingListRecord, "ownerId" | "visibility">,
  access: AccessContext
): boolean {
  if (canManageOwnedEntity(list.ownerId, access)) {
    return true;
  }

  return list.visibility === "public";
}

function canReadRecipe(
  recipe: Pick<RecipeRecord, "ownerId" | "status">,
  access: AccessContext
): boolean {
  if (canManageOwnedEntity(recipe.ownerId, access)) {
    return true;
  }

  return recipe.status === "published";
}

function ensureShoppingListReadable(list: ShoppingListRecord, access: AccessContext) {
  if (!canReadShoppingList(list, access)) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${list.id} was not found`);
  }
}

function ensureShoppingListEditable(list: ShoppingListRecord, access: AccessContext) {
  if (!canManageOwnedEntity(list.ownerId, access)) {
    throw new AppError(403, "SHOPPING_LIST_FORBIDDEN", "You do not have permission to manage this shopping list");
  }
}

export async function getShoppingLists(access: AccessContext) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to view your shopping lists");
  const lists = await listShoppingLists();
  const visibleLists = lists.filter((list) =>
    authenticatedAccess.role === "admin" ? true : list.ownerId === authenticatedAccess.userId
  );

  return {
    items: visibleLists.map((list) => {
      const dto = toShoppingListDto(list, authenticatedAccess);

      return {
        id: dto.id,
        name: dto.name,
        ownerId: dto.ownerId,
        status: dto.status,
        visibility: dto.visibility,
        isOwner: dto.isOwner,
        canEdit: dto.canEdit,
        isPublicReadable: dto.isPublicReadable,
        itemCount: dto.items.length,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt
      };
    })
  };
}

export async function getShoppingListOrThrow(id: string, access: AccessContext) {
  const list = await getShoppingListById(id);

  if (!list) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${id} was not found`);
  }

  ensureShoppingListReadable(list, access);
  return toShoppingListDto(list, access);
}

export async function createShoppingListEntry(input: CreateShoppingListInput, access: AccessContext) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to create shopping lists");
  const list = await createShoppingList({
    ...input,
    ownerId: authenticatedAccess.userId
  });

  if (!list) {
    throw new AppError(500, "SHOPPING_LIST_CREATE_FAILED", "Shopping list could not be created");
  }

  return toShoppingListDto(list, authenticatedAccess);
}

export async function addShoppingListItemEntry(
  shoppingListId: string,
  input: CreateShoppingListItemInput,
  access: AccessContext
) {
  const existingList = await getShoppingListById(shoppingListId);

  if (!existingList) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  ensureShoppingListEditable(existingList, access);

  const list = await addShoppingListItem(shoppingListId, input);

  if (!list) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  return toShoppingListDto(list, access);
}

export async function updateShoppingListItemEntry(
  shoppingListId: string,
  itemId: string,
  input: UpdateShoppingListItemInput,
  access: AccessContext
) {
  const existingList = await getShoppingListById(shoppingListId);

  if (!existingList) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  ensureShoppingListEditable(existingList, access);

  const list = await updateShoppingListItem(shoppingListId, itemId, input);

  if (!list) {
    throw new AppError(404, "SHOPPING_LIST_ITEM_NOT_FOUND", `Shopping list item ${itemId} was not found`);
  }

  return toShoppingListDto(list, access);
}

export async function deleteShoppingListItemEntry(
  shoppingListId: string,
  itemId: string,
  access: AccessContext
) {
  const existingList = await getShoppingListById(shoppingListId);

  if (!existingList) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  ensureShoppingListEditable(existingList, access);

  const list = await deleteShoppingListItem(shoppingListId, itemId);

  if (!list) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  return toShoppingListDto(list, access);
}

export async function importRecipeIntoShoppingList(
  shoppingListId: string,
  recipeId: string,
  access: AccessContext
) {
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  if (!canReadRecipe(recipe, access)) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  const list = await getShoppingListById(shoppingListId);

  if (!list) {
    throw new AppError(404, "SHOPPING_LIST_NOT_FOUND", `Shopping list ${shoppingListId} was not found`);
  }

  ensureShoppingListEditable(list, access);

  for (const ingredient of recipe.ingredients.sort((left, right) => left.sortOrder - right.sortOrder)) {
    await addShoppingListItem(shoppingListId, {
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      note: ingredient.preparationNote,
      checked: false,
      sourceRecipeId: recipe.id
    });
  }

  const updatedList = await getShoppingListById(shoppingListId);

  if (!updatedList) {
    throw new AppError(500, "SHOPPING_LIST_IMPORT_FAILED", "Recipe ingredients were not imported");
  }

  return toShoppingListDto(updatedList, access);
}
