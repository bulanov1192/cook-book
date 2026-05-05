export type RecipeStatus = "draft" | "published" | "private" | "archived";
export type RecipeVoteValue = "up" | "down";

export type RecipeVoteSummaryDto = {
  upvoteCount: number;
  downvoteCount: number;
  score: number;
  currentUserVote: RecipeVoteValue | null;
};

export type RecipeCommentAuthorDto = {
  id: string;
  name: string;
  image: string | null;
};

export type RecipeCommentDto = {
  id: string;
  recipeId: string;
  author: RecipeCommentAuthorDto;
  body: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type RecipeCommentListResponseDto = {
  items: RecipeCommentDto[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

export type RecipeIngredientDto = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  preparationNote: string | null;
  optional: boolean;
  sortOrder: number;
};

export type RecipeStepDto = {
  id: string;
  instruction: string;
  sortOrder: number;
};

export type RecipeDto = {
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
  vote: RecipeVoteSummaryDto;
  tags: string[];
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeListItemDto = Omit<RecipeDto, "ingredients" | "steps"> & {
  ingredientCount: number;
  stepCount: number;
  commentCount: number;
};
