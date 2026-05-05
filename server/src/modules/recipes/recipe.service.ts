import {
  requireAuthenticated,
  type AccessContext
} from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";
import { attachCommentCountsToRecipes } from "../recipe-comments/recipe-comment.service.js";
import { normalizePagination } from "../../shared/http/pagination.js";
import { attachVoteSummariesToRecipes } from "../recipe-votes/recipe-vote.service.js";
import { canReadRecipe, ensureRecipeEditable, ensureRecipeReadable } from "./recipe.access.js";
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
  } else if (sort === "score") {
    result = left.vote.score - right.vote.score;
  } else if (sort === "hotness") {
    result = computeHotness(left) - computeHotness(right);
  } else {
    result = left.createdAt.localeCompare(right.createdAt);
  }

  return order === "desc" ? result * -1 : result;
}

function computeHotness(recipe: Pick<RecipeListItemDto, "vote" | "commentCount" | "updatedAt">) {
  const updatedAtMs = Date.parse(recipe.updatedAt);
  const ageHours = Number.isNaN(updatedAtMs)
    ? 9999
    : Math.max(1, (Date.now() - updatedAtMs) / (1000 * 60 * 60));
  const engagement = recipe.vote.score * 3 + recipe.commentCount * 1.5 + recipe.vote.upvoteCount * 0.75;
  return engagement / Math.pow(ageHours + 2, 0.35);
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
    .map((recipe) => toRecipeListItemDto(recipe, access));

  const enrichedRecipes = await attachCommentCountsToRecipes(
    await attachVoteSummariesToRecipes(filteredRecipes, access)
  );

  const sortedRecipes = enrichedRecipes.sort((left, right) => compareRecipes(left, right, sort, order));
  const items = sortedRecipes.slice(pagination.offset, pagination.offset + pagination.limit);

  return {
    items,
    meta: {
      total: sortedRecipes.length,
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
  const [detailedRecipe] = await attachVoteSummariesToRecipes([toRecipeDto(recipe, access)], access);
  return detailedRecipe;
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

  const [createdRecipe] = await attachVoteSummariesToRecipes([toRecipeDto(recipe, authenticatedAccess)], authenticatedAccess);
  return createdRecipe;
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

  const [updatedRecipe] = await attachVoteSummariesToRecipes([toRecipeDto(recipe, access)], access);
  return updatedRecipe;
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

  const [archivedRecipe] = await attachVoteSummariesToRecipes([toRecipeDto(recipe, access)], access);
  return archivedRecipe;
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

  const [restoredRecipe] = await attachVoteSummariesToRecipes([toRecipeDto(recipe, access)], access);
  return restoredRecipe;
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
