export type UserRole = "user" | "admin";
export type RecipeStatus = "draft" | "published" | "private" | "archived";
export type ShoppingListStatus = "active" | "archived";
export type ShoppingListVisibility = "private" | "public";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type SessionResponse = {
  session: {
    id: string;
  } | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  preparationNote: string | null;
  optional: boolean;
  sortOrder: number;
};

export type RecipeStep = {
  id: string;
  instruction: string;
  sortOrder: number;
};

export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  servings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  notes: string | null;
  ownerId: string | null;
  status: RecipeStatus;
  isOwner: boolean;
  canEdit: boolean;
  isPublic: boolean;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeListItem = Omit<Recipe, "ingredients" | "steps"> & {
  ingredientCount: number;
  stepCount: number;
};

export type RecipeListResponse = {
  items: RecipeListItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type ShoppingListItem = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  sourceRecipeId: string | null;
  note: string | null;
  sortOrder: number;
};

export type ShoppingList = {
  id: string;
  name: string;
  ownerId: string | null;
  status: ShoppingListStatus;
  visibility: ShoppingListVisibility;
  isOwner: boolean;
  canEdit: boolean;
  isPublicReadable: boolean;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListSummary = {
  id: string;
  name: string;
  ownerId: string | null;
  status: ShoppingListStatus;
  visibility: ShoppingListVisibility;
  isOwner: boolean;
  canEdit: boolean;
  isPublicReadable: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListListResponse = {
  items: ShoppingListSummary[];
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryListResponse = {
  items: string[];
};

export type TagListResponse = {
  items: Tag[];
};

export type RecipePayload = {
  title: string;
  description?: string | null;
  category?: string | null;
  servings: number;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  notes?: string | null;
  status: RecipeStatus;
  tags: string[];
  ingredients: Array<{
    name: string;
    amount?: number | null;
    unit?: string | null;
    preparationNote?: string | null;
    optional?: boolean;
    sortOrder?: number;
  }>;
  steps: Array<{
    instruction: string;
    sortOrder?: number;
  }>;
};

export type ShoppingListItemPayload = {
  name: string;
  amount?: number | null;
  unit?: string | null;
  note?: string | null;
  checked?: boolean;
};

export type SignInPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignUpPayload = SignInPayload & {
  name: string;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
