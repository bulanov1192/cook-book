export type Locale = "en" | "ru";
export type UserRole = "user" | "admin";
export type RecipeStatus = "draft" | "published" | "private" | "archived";
export type ShoppingListStatus = "active" | "archived";
export type ShoppingListVisibility = "private" | "public";
export type RecipeVoteValue = "up" | "down";

export type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locale: Locale;
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
  vote: {
    upvoteCount: number;
    downvoteCount: number;
    score: number;
    currentUserVote: RecipeVoteValue | null;
  };
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeListItem = Omit<Recipe, "ingredients" | "steps"> & {
  ingredientCount: number;
  stepCount: number;
  commentCount: number;
};

export type RecipeListResponse = {
  items: RecipeListItem[];
  meta: PaginationMeta;
};

export type RecipeCommentAuthor = {
  id: string;
  name: string;
  image: string | null;
};

export type RecipeComment = {
  id: string;
  recipeId: string;
  parentCommentId: string | null;
  rootCommentId: string;
  depth: number;
  replyCount: number;
  score: number;
  author: RecipeCommentAuthor;
  body: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  canEdit: boolean;
  canDelete: boolean;
  previewReplies: RecipeComment[];
  loadedReplyCount: number;
  hasMoreReplies: boolean;
};

export type RecipeCommentListResponse = {
  items: RecipeComment[];
  meta: PaginationMeta;
};

export type RecipeVoteSummary = Recipe["vote"];

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
  meta: PaginationMeta;
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

export type RecipeCommentPayload = {
  body: string;
  parentCommentId?: string;
};

export type RecipeVotePayload = {
  value: RecipeVoteValue;
};

export type UpdatePreferencesPayload = {
  locale: Locale;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
