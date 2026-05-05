import type { Request, Response } from "express";
import {
  createRecipeCommentSchema,
  listRecipeCommentsQuerySchema,
  listRecipeCommentRepliesQuerySchema,
  recipeCommentIdParamsSchema,
  recipeCommentParamsSchema,
  updateRecipeCommentSchema
} from "./recipe-comment.schemas.js";
import {
  createRecipeCommentEntry,
  deleteRecipeCommentEntry,
  getRecipeComments,
  getRecipeCommentReplies,
  updateRecipeCommentEntry
} from "./recipe-comment.service.js";

export async function listRecipeCommentsHandler(request: Request, response: Response) {
  const { id } = recipeCommentParamsSchema.parse(request.params);
  const query = listRecipeCommentsQuerySchema.parse(request.query);
  response.json(await getRecipeComments(id, query, request.auth));
}

export async function createRecipeCommentHandler(request: Request, response: Response) {
  const { id } = recipeCommentParamsSchema.parse(request.params);
  const input = createRecipeCommentSchema.parse(request.body);
  response.status(201).json(await createRecipeCommentEntry(id, input, request.auth));
}

export async function listRecipeCommentRepliesHandler(request: Request, response: Response) {
  const { id, commentId } = recipeCommentIdParamsSchema.parse(request.params);
  const query = listRecipeCommentRepliesQuerySchema.parse(request.query);
  response.json(await getRecipeCommentReplies(id, commentId, query, request.auth));
}

export async function updateRecipeCommentHandler(request: Request, response: Response) {
  const { id, commentId } = recipeCommentIdParamsSchema.parse(request.params);
  const input = updateRecipeCommentSchema.parse(request.body);
  response.json(await updateRecipeCommentEntry(id, commentId, input, request.auth));
}

export async function deleteRecipeCommentHandler(request: Request, response: Response) {
  const { id, commentId } = recipeCommentIdParamsSchema.parse(request.params);
  response.json(await deleteRecipeCommentEntry(id, commentId, request.auth));
}
