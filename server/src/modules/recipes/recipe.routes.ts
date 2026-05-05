import { Router } from "express";
import {
  createRecipeCommentHandler,
  deleteRecipeCommentHandler,
  listRecipeCommentsHandler,
  updateRecipeCommentHandler
} from "../recipe-comments/recipe-comment.controller.js";
import {
  clearRecipeVoteHandler,
  getRecipeVoteHandler,
  setRecipeVoteHandler
} from "../recipe-votes/recipe-vote.controller.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  archiveRecipeHandler,
  createRecipeHandler,
  getRecipeHandler,
  listCategoriesHandler,
  listRecipesHandler,
  listTagsHandler,
  restoreRecipeHandler,
  updateRecipeHandler
} from "./recipe.controller.js";

export const recipeRouter = Router();

recipeRouter.get("/", asyncHandler(listRecipesHandler));
recipeRouter.get("/categories", asyncHandler(listCategoriesHandler));
recipeRouter.get("/tags", asyncHandler(listTagsHandler));
recipeRouter.get("/:id", asyncHandler(getRecipeHandler));
recipeRouter.get("/:id/vote", asyncHandler(getRecipeVoteHandler));
recipeRouter.put("/:id/vote", asyncHandler(setRecipeVoteHandler));
recipeRouter.delete("/:id/vote", asyncHandler(clearRecipeVoteHandler));
recipeRouter.get("/:id/comments", asyncHandler(listRecipeCommentsHandler));
recipeRouter.post("/:id/comments", asyncHandler(createRecipeCommentHandler));
recipeRouter.patch("/:id/comments/:commentId", asyncHandler(updateRecipeCommentHandler));
recipeRouter.delete("/:id/comments/:commentId", asyncHandler(deleteRecipeCommentHandler));
recipeRouter.post("/", asyncHandler(createRecipeHandler));
recipeRouter.patch("/:id", asyncHandler(updateRecipeHandler));
recipeRouter.post("/:id/archive", asyncHandler(archiveRecipeHandler));
recipeRouter.post("/:id/restore", asyncHandler(restoreRecipeHandler));
