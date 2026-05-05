import { z } from "zod";

export const recipeVoteValueSchema = z.enum(["up", "down"]);

export const recipeVoteParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const setRecipeVoteSchema = z.object({
  value: recipeVoteValueSchema
});

export type RecipeVoteValue = z.infer<typeof recipeVoteValueSchema>;
export type SetRecipeVoteInput = z.infer<typeof setRecipeVoteSchema>;
