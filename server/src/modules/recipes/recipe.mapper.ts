import { canManageOwnedEntity, type AccessContext } from "../../auth/access.js";
import type { RecipeDto, RecipeListItemDto } from "./recipe.types.js";

type RecipeRecord = {
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
  status: "draft" | "published" | "private" | "archived";
  createdAt: string;
  updatedAt: string;
  ingredients: Array<{
    id: string;
    name: string;
    amount: number | null;
    unit: string | null;
    preparationNote: string | null;
    optional: boolean;
    sortOrder: number;
  }>;
  steps: Array<{
    id: string;
    instruction: string;
    sortOrder: number;
  }>;
  tagLinks: Array<{
    tag: {
      name: string;
    } | null;
  }>;
};

function isPublicRecipe(recipe: Pick<RecipeRecord, "status">): boolean {
  return recipe.status === "published";
}

export function toRecipeDto(recipe: RecipeRecord, access: AccessContext): RecipeDto {
  const isOwner = access.userId === recipe.ownerId;
  const canEdit = canManageOwnedEntity(recipe.ownerId, access);

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    totalMinutes: recipe.totalMinutes,
    notes: recipe.notes,
    ownerId: recipe.ownerId,
    status: recipe.status,
    isOwner,
    canEdit,
    isPublic: isPublicRecipe(recipe),
    tags: recipe.tagLinks
      .map((tagLink) => tagLink.tag?.name ?? null)
      .filter((tagName): tagName is string => tagName !== null),
    ingredients: recipe.ingredients
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    steps: recipe.steps.slice().sort((left, right) => left.sortOrder - right.sortOrder),
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };
}

export function toRecipeListItemDto(recipe: RecipeRecord, access: AccessContext): RecipeListItemDto {
  const detailedRecipe = toRecipeDto(recipe, access);

  return {
    id: detailedRecipe.id,
    title: detailedRecipe.title,
    description: detailedRecipe.description,
    category: detailedRecipe.category,
    servings: detailedRecipe.servings,
    prepMinutes: detailedRecipe.prepMinutes,
    cookMinutes: detailedRecipe.cookMinutes,
    totalMinutes: detailedRecipe.totalMinutes,
    notes: detailedRecipe.notes,
    ownerId: detailedRecipe.ownerId,
    status: detailedRecipe.status,
    isOwner: detailedRecipe.isOwner,
    canEdit: detailedRecipe.canEdit,
    isPublic: detailedRecipe.isPublic,
    tags: detailedRecipe.tags,
    createdAt: detailedRecipe.createdAt,
    updatedAt: detailedRecipe.updatedAt,
    ingredientCount: detailedRecipe.ingredients.length,
    stepCount: detailedRecipe.steps.length
  };
}
