import { z } from "zod";

export const recipeStatusSchema = z.enum(["draft", "published", "private", "archived"]);
export const recipeSortSchema = z.enum(["createdAt", "updatedAt", "title", "totalMinutes"]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

export const ingredientInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().finite().positive().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  preparationNote: z.string().trim().min(1).max(120).nullable().optional(),
  optional: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(1).optional()
});

export const stepInputSchema = z.object({
  instruction: z.string().trim().min(1).max(1000),
  sortOrder: z.number().int().min(1).optional()
});

export const createRecipeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  servings: z.number().int().min(1).max(100),
  prepMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  totalMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: recipeStatusSchema.default("draft"),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  ingredients: z.array(ingredientInputSchema).max(100).default([]),
  steps: z.array(stepInputSchema).max(100).default([])
});

export const updateRecipeSchema = createRecipeSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const listRecipesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  status: recipeStatusSchema.optional(),
  sort: recipeSortSchema.optional(),
  order: sortOrderSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const recipeIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type ListRecipesQuery = z.infer<typeof listRecipesQuerySchema>;
