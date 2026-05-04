import { Router } from "express";
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
recipeRouter.post("/", asyncHandler(createRecipeHandler));
recipeRouter.patch("/:id", asyncHandler(updateRecipeHandler));
recipeRouter.post("/:id/archive", asyncHandler(archiveRecipeHandler));
recipeRouter.post("/:id/restore", asyncHandler(restoreRecipeHandler));

