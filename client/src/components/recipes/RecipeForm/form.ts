import type { Recipe, RecipePayload, RecipeStatus } from "$lib/api/types";

export type IngredientDraft = {
  name: string;
  amount: string;
  unit: string;
  preparationNote: string;
  optional: boolean;
};

export type StepDraft = {
  instruction: string;
};

export type RecipeFormState = {
  title: string;
  description: string;
  category: string;
  servings: number;
  prepMinutes: string;
  cookMinutes: string;
  totalMinutes: string;
  notes: string;
  status: RecipeStatus;
  tags: string;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
};

export function createEmptyIngredient(): IngredientDraft {
  return {
    name: "",
    amount: "",
    unit: "",
    preparationNote: "",
    optional: false
  };
}

export function createEmptyStep(): StepDraft {
  return {
    instruction: ""
  };
}

export function createRecipeFormState(recipe?: Recipe): RecipeFormState {
  if (!recipe) {
    return {
      title: "",
      description: "",
      category: "",
      servings: 2,
      prepMinutes: "",
      cookMinutes: "",
      totalMinutes: "",
      notes: "",
      status: "draft",
      tags: "",
      ingredients: [createEmptyIngredient()],
      steps: [createEmptyStep()]
    };
  }

  return {
    title: recipe.title,
    description: recipe.description ?? "",
    category: recipe.category ?? "",
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes?.toString() ?? "",
    cookMinutes: recipe.cookMinutes?.toString() ?? "",
    totalMinutes: recipe.totalMinutes?.toString() ?? "",
    notes: recipe.notes ?? "",
    status: recipe.status,
    tags: recipe.tags.join(", "),
    ingredients: recipe.ingredients.length
      ? recipe.ingredients.map((ingredient) => ({
          name: ingredient.name,
          amount: ingredient.amount?.toString() ?? "",
          unit: ingredient.unit ?? "",
          preparationNote: ingredient.preparationNote ?? "",
          optional: ingredient.optional
        }))
      : [createEmptyIngredient()],
    steps: recipe.steps.length
      ? recipe.steps.map((step) => ({
          instruction: step.instruction
        }))
      : [createEmptyStep()]
  };
}

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toRecipePayload(state: RecipeFormState): RecipePayload {
  return {
    title: state.title.trim(),
    description: state.description.trim() || null,
    category: state.category.trim() || null,
    servings: state.servings,
    prepMinutes: parseNullableNumber(state.prepMinutes),
    cookMinutes: parseNullableNumber(state.cookMinutes),
    totalMinutes: parseNullableNumber(state.totalMinutes),
    notes: state.notes.trim() || null,
    status: state.status,
    tags: state.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    ingredients: state.ingredients
      .map((ingredient, index) => ({
        name: ingredient.name.trim(),
        amount: parseNullableNumber(ingredient.amount),
        unit: ingredient.unit.trim() || null,
        preparationNote: ingredient.preparationNote.trim() || null,
        optional: ingredient.optional,
        sortOrder: index + 1
      }))
      .filter((ingredient) => ingredient.name.length > 0),
    steps: state.steps
      .map((step, index) => ({
        instruction: step.instruction.trim(),
        sortOrder: index + 1
      }))
      .filter((step) => step.instruction.length > 0)
  };
}
