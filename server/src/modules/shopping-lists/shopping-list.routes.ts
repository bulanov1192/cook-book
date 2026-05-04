import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
  addShoppingListItemHandler,
  createShoppingListHandler,
  deleteShoppingListItemHandler,
  getShoppingListHandler,
  importRecipeIntoShoppingListHandler,
  listShoppingListsHandler,
  updateShoppingListItemHandler
} from "./shopping-list.controller.js";

export const shoppingListRouter = Router();

shoppingListRouter.get("/", asyncHandler(listShoppingListsHandler));
shoppingListRouter.post("/", asyncHandler(createShoppingListHandler));
shoppingListRouter.get("/:id", asyncHandler(getShoppingListHandler));
shoppingListRouter.post("/:id/items", asyncHandler(addShoppingListItemHandler));
shoppingListRouter.patch("/:id/items/:itemId", asyncHandler(updateShoppingListItemHandler));
shoppingListRouter.delete("/:id/items/:itemId", asyncHandler(deleteShoppingListItemHandler));
shoppingListRouter.post("/:id/import-recipe", asyncHandler(importRecipeIntoShoppingListHandler));

