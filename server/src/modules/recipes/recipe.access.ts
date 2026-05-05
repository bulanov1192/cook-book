import { canManageOwnedEntity, type AccessContext } from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";

export type MinimalRecipeAccessRecord = {
  id: string;
  ownerId: string | null;
  status: "draft" | "published" | "private" | "archived";
};

export function canReadRecipe(recipe: Pick<MinimalRecipeAccessRecord, "ownerId" | "status">, access: AccessContext) {
  if (canManageOwnedEntity(recipe.ownerId, access)) {
    return true;
  }

  return recipe.status === "published";
}

export function ensureRecipeReadable(recipe: MinimalRecipeAccessRecord, access: AccessContext) {
  if (!canReadRecipe(recipe, access)) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipe.id} was not found`);
  }
}

export function ensureRecipeEditable(recipe: MinimalRecipeAccessRecord, access: AccessContext) {
  if (!canManageOwnedEntity(recipe.ownerId, access)) {
    throw new AppError(403, "RECIPE_FORBIDDEN", "You do not have permission to manage this recipe");
  }
}
