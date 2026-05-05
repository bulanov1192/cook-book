import { z } from "zod";

export const shoppingListStatusSchema = z.enum(["active", "archived"]);
export const shoppingListVisibilitySchema = z.enum(["private", "public"]);

export const shoppingListIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const shoppingListItemIdParamsSchema = z.object({
  id: z.string().trim().min(1),
  itemId: z.string().trim().min(1)
});

export const createShoppingListSchema = z.object({
  name: z.string().trim().min(1).max(120),
  visibility: shoppingListVisibilitySchema.default("private")
});

export const listShoppingListsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const createShoppingListItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().finite().positive().nullable().optional(),
  unit: z.string().trim().min(1).max(40).nullable().optional(),
  note: z.string().trim().max(240).nullable().optional(),
  checked: z.boolean().optional().default(false)
});

export const updateShoppingListItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    amount: z.number().finite().positive().nullable().optional(),
    unit: z.string().trim().min(1).max(40).nullable().optional(),
    note: z.string().trim().max(240).nullable().optional(),
    checked: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided"
  });

export const importRecipeIntoShoppingListSchema = z.object({
  recipeId: z.string().trim().min(1)
});

export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;
export type ListShoppingListsQuery = z.infer<typeof listShoppingListsQuerySchema>;
export type CreateShoppingListItemInput = z.infer<typeof createShoppingListItemSchema>;
export type UpdateShoppingListItemInput = z.infer<typeof updateShoppingListItemSchema>;
