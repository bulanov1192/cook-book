export type ShoppingListStatus = "active" | "archived";
export type ShoppingListVisibility = "private" | "public";

export type ShoppingListItemDto = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  sourceRecipeId: string | null;
  note: string | null;
  sortOrder: number;
};

export type ShoppingListDto = {
  id: string;
  name: string;
  ownerId: string | null;
  status: ShoppingListStatus;
  visibility: ShoppingListVisibility;
  isOwner: boolean;
  canEdit: boolean;
  isPublicReadable: boolean;
  items: ShoppingListItemDto[];
  createdAt: string;
  updatedAt: string;
};
