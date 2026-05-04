import { canManageOwnedEntity, type AccessContext } from "../../auth/access.js";
import type { ShoppingListDto } from "./shopping-list.types.js";

type ShoppingListRecord = {
  id: string;
  name: string;
  ownerId: string | null;
  status: "active" | "archived";
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    amount: number | null;
    unit: string | null;
    checked: boolean;
    sourceRecipeId: string | null;
    note: string | null;
    sortOrder: number;
  }>;
};

export function toShoppingListDto(list: ShoppingListRecord, access: AccessContext): ShoppingListDto {
  const isOwner = access.userId === list.ownerId;
  const canEdit = canManageOwnedEntity(list.ownerId, access);

  return {
    id: list.id,
    name: list.name,
    ownerId: list.ownerId,
    status: list.status,
    visibility: list.visibility,
    isOwner,
    canEdit,
    isPublicReadable: list.visibility === "public",
    items: list.items.slice().sort((left, right) => left.sortOrder - right.sortOrder),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt
  };
}
