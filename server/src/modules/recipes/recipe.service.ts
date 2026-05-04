import {
  canManageOwnedEntity,
  requireAuthenticated,
  type AccessContext
} from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";
import { normalizePagination } from "../../shared/http/pagination.js";
import {
  archiveRecipe,
  createRecipe,
  getRecipeById,
  listRecipes,
  updateRecipe,
  restoreRecipe
} from "./recipe.repository.js";
import { toRecipeDto, toRecipeListItemDto } from "./recipe.mapper.js";
import type {
  CreateRecipeInput,
  ListRecipesQuery,
  UpdateRecipeInput
} from "./recipe.schemas.js";
import type { RecipeListItemDto } from "./recipe.types.js";

type RecipeRecord = NonNullable<Awaited<ReturnType<typeof getRecipeById>>>;

function normalizeText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function matchesSearch(recipe: RecipeListItemDto & { ingredients: Array<{ name: string }> }, query: string) {
  const haystack = [
    recipe.title,
    recipe.description ?? "",
    recipe.category ?? "",
    recipe.tags.join(" "),
    recipe.ingredients.map((ingredient) => ingredient.name).join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function compareRecipes(
  left: RecipeListItemDto,
  right: RecipeListItemDto,
  sort: NonNullable<ListRecipesQuery["sort"]>,
  order: NonNullable<ListRecipesQuery["order"]>
) {
  let result = 0;

  if (sort === "title") {
    result = left.title.localeCompare(right.title);
  } else if (sort === "updatedAt") {
    result = left.updatedAt.localeCompare(right.updatedAt);
  } else if (sort === "totalMinutes") {
    result = (left.totalMinutes ?? Number.MAX_SAFE_INTEGER) - (right.totalMinutes ?? Number.MAX_SAFE_INTEGER);
  } else {
    result = left.createdAt.localeCompare(right.createdAt);
  }

  return order === "desc" ? result * -1 : result;
}

function ensurePublishableRecipe(input: {
  status?: "draft" | "published" | "private" | "archived";
  ingredients: unknown[];
  steps: unknown[];
}) {
  if (input.status !== "published") {
    return;
  }

  if (!input.ingredients.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Published recipe requires at least one ingredient");
  }

  if (!input.steps.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Published recipe requires at least one step");
  }
}

function canReadRecipe(recipe: Pick<RecipeRecord, "status" | "ownerId">, access: AccessContext): boolean {
  if (canManageOwnedEntity(recipe.ownerId, access)) {
    return true;
  }

  return recipe.status === "published";
}

function ensureRecipeReadable(recipe: RecipeRecord, access: AccessContext) {
  if (!canReadRecipe(recipe, access)) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipe.id} was not found`);
  }
}

function ensureRecipeEditable(recipe: RecipeRecord, access: AccessContext) {
  if (!canManageOwnedEntity(recipe.ownerId, access)) {
    throw new AppError(403, "RECIPE_FORBIDDEN", "You do not have permission to manage this recipe");
  }
}

export async function getRecipes(query: ListRecipesQuery, access: AccessContext) {
  const pagination = normalizePagination(query.limit, query.offset);
  const searchQuery = normalizeText(query.q);
  const category = normalizeText(query.category);
  const tag = normalizeText(query.tag);
  const sort = query.sort ?? "createdAt";
  const order = query.order ?? "desc";

  const allRecipes = await listRecipes();

  const filteredRecipes = allRecipes
    .filter((recipe) => canReadRecipe(recipe, access))
    .filter((recipe) => {
      if (query.status && recipe.status !== query.status) {
        return false;
      }

      if (category && recipe.category?.toLowerCase() !== category) {
        return false;
      }

      if (tag) {
        const tagNames = recipe.tagLinks
          .map((tagLink) => tagLink.tag?.name.toLowerCase() ?? null)
          .filter((tagName): tagName is string => tagName !== null);

        if (!tagNames.includes(tag)) {
          return false;
        }
      }

      const mappedRecipe = {
        ...toRecipeListItemDto(recipe, access),
        ingredients: recipe.ingredients
      };

      if (searchQuery && !matchesSearch(mappedRecipe, searchQuery)) {
        return false;
      }

      return true;
    })
    .map((recipe) => toRecipeListItemDto(recipe, access))
    .sort((left, right) => compareRecipes(left, right, sort, order));

  return {
    items: filteredRecipes.slice(pagination.offset, pagination.offset + pagination.limit),
    meta: {
      total: filteredRecipes.length,
      limit: pagination.limit,
      offset: pagination.offset
    }
  };
}

export async function getRecipeOrThrow(id: string, access: AccessContext) {
  const recipe = await getRecipeById(id);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  ensureRecipeReadable(recipe, access);
  return toRecipeDto(recipe, access);
}

export async function createRecipeEntry(input: CreateRecipeInput, access: AccessContext) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to create recipes");

  ensurePublishableRecipe({
    status: input.status,
    ingredients: input.ingredients,
    steps: input.steps
  });

  const recipe = await createRecipe(input, authenticatedAccess.userId);

  if (!recipe) {
    throw new AppError(500, "RECIPE_CREATE_FAILED", "Recipe could not be created");
  }

  return toRecipeDto(recipe, authenticatedAccess);
}

export async function updateRecipeEntry(id: string, input: UpdateRecipeInput, access: AccessContext) {
  const existingRecipe = await getRecipeById(id);

  if (!existingRecipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  ensureRecipeEditable(existingRecipe, access);

  const nextIngredients = input.ingredients ?? existingRecipe.ingredients;
  const nextSteps = input.steps ?? existingRecipe.steps;
  const nextStatus = input.status ?? existingRecipe.status;

  ensurePublishableRecipe({
    status: nextStatus,
    ingredients: nextIngredients,
    steps: nextSteps
  });

  const recipe = await updateRecipe(id, input);

  if (!recipe) {
    throw new AppError(500, "RECIPE_UPDATE_FAILED", `Recipe ${id} could not be updated`);
  }

  return toRecipeDto(recipe, access);
}

export async function archiveRecipeEntry(id: string, access: AccessContext) {
  const existingRecipe = await getRecipeById(id);

  if (!existingRecipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  ensureRecipeEditable(existingRecipe, access);

  const recipe = await archiveRecipe(id);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  return toRecipeDto(recipe, access);
}

export async function restoreRecipeEntry(id: string, access: AccessContext) {
  const existingRecipe = await getRecipeById(id);

  if (!existingRecipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  ensureRecipeEditable(existingRecipe, access);

  const recipe = await restoreRecipe(id);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${id} was not found`);
  }

  return toRecipeDto(recipe, access);
}

export async function getRecipeCategories(access: AccessContext) {
  const recipes = await listRecipes();
  const items = Array.from(
    new Set(
      recipes
        .filter((recipe) => canReadRecipe(recipe, access))
        .map((recipe) => recipe.category)
        .filter((category): category is string => Boolean(category))
    )
  ).sort((left, right) => left.localeCompare(right));

  return { items };
}

export async function getRecipeTags(access: AccessContext) {
  const recipes = await listRecipes();
  const tagMap = new Map<string, { id: string; name: string; slug: string }>();

  for (const recipe of recipes) {
    if (!canReadRecipe(recipe, access)) {
      continue;
    }

    for (const tagLink of recipe.tagLinks) {
      if (!tagLink.tag) {
        continue;
      }

      tagMap.set(tagLink.tag.id, {
        id: tagLink.tag.id,
        name: tagLink.tag.name,
        slug: tagLink.tag.slug
      });
    }
  }

  return {
    items: Array.from(tagMap.values()).sort((left, right) => left.name.localeCompare(right.name))
  };
}
