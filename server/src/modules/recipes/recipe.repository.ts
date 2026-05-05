import { asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  recipeIngredients,
  recipeSteps,
  recipeTagLinks,
  recipes,
  tags
} from "../../db/schema.js";
import type {
  CreateRecipeInput,
  ListRecipesQuery,
  UpdateRecipeInput
} from "./recipe.schemas.js";

function nowIsoString(): string {
  return new Date().toISOString();
}

function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-+|-+$/g, "");
}

type RecipeWithRelations = Awaited<ReturnType<typeof getRecipeById>>;

export async function listRecipes(): Promise<NonNullable<RecipeWithRelations>[]> {
  return db.query.recipes.findMany({
    with: {
      voteSummary: true,
      ingredients: true,
      steps: true,
      tagLinks: {
        with: {
          tag: true
        }
      }
    }
  });
}

export async function getRecipeById(id: string) {
  return db.query.recipes.findFirst({
    where: eq(recipes.id, id),
    with: {
      voteSummary: true,
      ingredients: true,
      steps: true,
      tagLinks: {
        with: {
          tag: true
        }
      }
    }
  });
}

async function ensureTags(tagNames: string[]) {
  const normalizedTagNames = Array.from(
    new Set(
      tagNames
        .map((tagName) => tagName.trim())
        .filter((tagName) => tagName.length > 0)
    )
  );

  if (!normalizedTagNames.length) {
    return [];
  }

  const tagSlugs = normalizedTagNames.map(slugifyTag);
  const existingTags = await db
    .select()
    .from(tags)
    .where(inArray(tags.slug, tagSlugs));

  const tagsBySlug = new Map(existingTags.map((tag) => [tag.slug, tag]));

  for (const tagName of normalizedTagNames) {
    const slug = slugifyTag(tagName);

    if (tagsBySlug.has(slug)) {
      continue;
    }

    const createdTag = {
      id: crypto.randomUUID(),
      name: tagName,
      slug
    };

    await db.insert(tags).values(createdTag);
    tagsBySlug.set(slug, createdTag);
  }

  return normalizedTagNames
    .map((tagName) => tagsBySlug.get(slugifyTag(tagName)))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag));
}

async function replaceRecipeIngredients(recipeId: string, ingredientsInput: CreateRecipeInput["ingredients"]) {
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));

  if (!ingredientsInput.length) {
    return;
  }

  await db.insert(recipeIngredients).values(
    ingredientsInput.map((ingredient, index) => ({
      id: crypto.randomUUID(),
      recipeId,
      name: ingredient.name,
      amount: ingredient.amount ?? null,
      unit: ingredient.unit ?? null,
      preparationNote: ingredient.preparationNote ?? null,
      optional: ingredient.optional ?? false,
      sortOrder: ingredient.sortOrder ?? index + 1
    }))
  );
}

async function replaceRecipeSteps(recipeId: string, stepsInput: CreateRecipeInput["steps"]) {
  await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));

  if (!stepsInput.length) {
    return;
  }

  await db.insert(recipeSteps).values(
    stepsInput.map((step, index) => ({
      id: crypto.randomUUID(),
      recipeId,
      instruction: step.instruction,
      sortOrder: step.sortOrder ?? index + 1
    }))
  );
}

async function replaceRecipeTags(recipeId: string, tagNames: string[]) {
  await db.delete(recipeTagLinks).where(eq(recipeTagLinks.recipeId, recipeId));
  const resolvedTags = await ensureTags(tagNames);

  if (!resolvedTags.length) {
    return;
  }

  await db.insert(recipeTagLinks).values(
    resolvedTags.map((tag) => ({
      recipeId,
      tagId: tag.id
    }))
  );
}

export async function createRecipe(input: CreateRecipeInput, ownerId: string) {
  const timestamp = nowIsoString();
  const recipeId = crypto.randomUUID();

  await db.insert(recipes).values({
    id: recipeId,
    title: input.title,
    description: input.description ?? null,
    category: input.category ?? null,
    servings: input.servings,
    prepMinutes: input.prepMinutes ?? null,
    cookMinutes: input.cookMinutes ?? null,
    totalMinutes: input.totalMinutes ?? null,
    notes: input.notes ?? null,
    ownerId,
    status: input.status,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  await replaceRecipeIngredients(recipeId, input.ingredients);
  await replaceRecipeSteps(recipeId, input.steps);
  await replaceRecipeTags(recipeId, input.tags);

  return getRecipeById(recipeId);
}

export async function updateRecipe(id: string, input: UpdateRecipeInput) {
  const currentRecipe = await getRecipeById(id);

  if (!currentRecipe) {
    return null;
  }

  const timestamp = nowIsoString();

  await db
    .update(recipes)
    .set({
      title: input.title ?? currentRecipe.title,
      description: input.description === undefined ? currentRecipe.description : input.description,
      category: input.category === undefined ? currentRecipe.category : input.category,
      servings: input.servings ?? currentRecipe.servings,
      prepMinutes: input.prepMinutes === undefined ? currentRecipe.prepMinutes : input.prepMinutes,
      cookMinutes: input.cookMinutes === undefined ? currentRecipe.cookMinutes : input.cookMinutes,
      totalMinutes:
        input.totalMinutes === undefined ? currentRecipe.totalMinutes : input.totalMinutes,
      notes: input.notes === undefined ? currentRecipe.notes : input.notes,
      status: input.status ?? currentRecipe.status,
      updatedAt: timestamp
    })
    .where(eq(recipes.id, id));

  if (input.ingredients) {
    await replaceRecipeIngredients(id, input.ingredients);
  }

  if (input.steps) {
    await replaceRecipeSteps(id, input.steps);
  }

  if (input.tags) {
    await replaceRecipeTags(id, input.tags);
  }

  return getRecipeById(id);
}

export async function archiveRecipe(id: string) {
  const currentRecipe = await getRecipeById(id);

  if (!currentRecipe) {
    return null;
  }

  await db
    .update(recipes)
    .set({
      status: "archived",
      updatedAt: nowIsoString()
    })
    .where(eq(recipes.id, id));

  return getRecipeById(id);
}

export async function restoreRecipe(id: string) {
  const currentRecipe = await getRecipeById(id);

  if (!currentRecipe) {
    return null;
  }

  await db
    .update(recipes)
    .set({
      status: "draft",
      updatedAt: nowIsoString()
    })
    .where(eq(recipes.id, id));

  return getRecipeById(id);
}

export async function listCategoryNames() {
  const rows = await db
    .selectDistinct({ category: recipes.category })
    .from(recipes);

  return rows
    .map((row) => row.category)
    .filter((category): category is string => Boolean(category))
    .sort((left, right) => left.localeCompare(right));
}

export async function listTags() {
  return db.select().from(tags).orderBy(asc(tags.name));
}
