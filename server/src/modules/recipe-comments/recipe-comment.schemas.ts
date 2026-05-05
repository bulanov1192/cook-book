import { z } from "zod";

export const recipeCommentParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const recipeCommentIdParamsSchema = z.object({
  id: z.string().trim().min(1),
  commentId: z.string().trim().min(1)
});

export const listRecipeCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const listRecipeCommentRepliesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const createRecipeCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  parentCommentId: z.string().trim().min(1).optional()
});

export const updateRecipeCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000)
});

export type ListRecipeCommentsQuery = z.infer<typeof listRecipeCommentsQuerySchema>;
export type ListRecipeCommentRepliesQuery = z.infer<typeof listRecipeCommentRepliesQuerySchema>;
export type CreateRecipeCommentInput = z.infer<typeof createRecipeCommentSchema>;
export type UpdateRecipeCommentInput = z.infer<typeof updateRecipeCommentSchema>;
