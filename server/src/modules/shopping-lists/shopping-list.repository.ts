import { eq, max } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  shoppingListItems,
  shoppingLists
} from "../../db/schema.js";
import type {
  CreateShoppingListInput,
  CreateShoppingListItemInput,
  UpdateShoppingListItemInput
} from "./shopping-list.schemas.js";

function nowIsoString(): string {
  return new Date().toISOString();
}

export async function listShoppingLists() {
  return db.query.shoppingLists.findMany({
    with: {
      items: true
    }
  });
}

export async function getShoppingListById(id: string) {
  return db.query.shoppingLists.findFirst({
    where: eq(shoppingLists.id, id),
    with: {
      items: true
    }
  });
}

export async function createShoppingList(
  input: CreateShoppingListInput & { ownerId: string }
) {
  const timestamp = nowIsoString();
  const listId = crypto.randomUUID();

  await db.insert(shoppingLists).values({
    id: listId,
    name: input.name,
    ownerId: input.ownerId,
    status: "active",
    visibility: input.visibility ?? "private",
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return getShoppingListById(listId);
}

async function getNextSortOrder(shoppingListId: string) {
  const [row] = await db
    .select({ maxSortOrder: max(shoppingListItems.sortOrder) })
    .from(shoppingListItems)
    .where(eq(shoppingListItems.shoppingListId, shoppingListId));

  return (row?.maxSortOrder ?? 0) + 1;
}

export async function addShoppingListItem(
  shoppingListId: string,
  input: CreateShoppingListItemInput & { sourceRecipeId?: string | null }
) {
  const itemId = crypto.randomUUID();
  const sortOrder = await getNextSortOrder(shoppingListId);

  await db.insert(shoppingListItems).values({
    id: itemId,
    shoppingListId,
    name: input.name,
    amount: input.amount ?? null,
    unit: input.unit ?? null,
    checked: input.checked ?? false,
    sourceRecipeId: input.sourceRecipeId ?? null,
    note: input.note ?? null,
    sortOrder
  });

  await touchShoppingList(shoppingListId);
  return getShoppingListById(shoppingListId);
}

export async function updateShoppingListItem(
  shoppingListId: string,
  itemId: string,
  input: UpdateShoppingListItemInput
) {
  const existingList = await getShoppingListById(shoppingListId);

  if (!existingList) {
    return null;
  }

  const existingItem = existingList.items.find((item) => item.id === itemId);

  if (!existingItem) {
    return null;
  }

  await db
    .update(shoppingListItems)
    .set({
      name: input.name ?? existingItem.name,
      amount: input.amount === undefined ? existingItem.amount : input.amount,
      unit: input.unit === undefined ? existingItem.unit : input.unit,
      note: input.note === undefined ? existingItem.note : input.note,
      checked: input.checked ?? existingItem.checked
    })
    .where(eq(shoppingListItems.id, itemId));

  await touchShoppingList(shoppingListId);
  return getShoppingListById(shoppingListId);
}

export async function deleteShoppingListItem(shoppingListId: string, itemId: string) {
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
  await touchShoppingList(shoppingListId);
  return getShoppingListById(shoppingListId);
}

export async function touchShoppingList(id: string) {
  await db
    .update(shoppingLists)
    .set({
      updatedAt: nowIsoString()
    })
    .where(eq(shoppingLists.id, id));
}
