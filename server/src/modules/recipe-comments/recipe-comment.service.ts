import { isAdmin, requireAuthenticated, type AccessContext } from "../../auth/access.js";
import { AppError } from "../../shared/errors/app-error.js";
import { normalizePagination } from "../../shared/http/pagination.js";
import { ensureRecipeReadable } from "../recipes/recipe.access.js";
import { getRecipeById } from "../recipes/recipe.repository.js";
import type { RecipeCommentDto } from "../recipes/recipe.types.js";
import {
  createRecipeComment,
  deleteRecipeComment,
  getRecipeCommentById,
  listRecipeCommentCounts,
  listRecipeComments,
  updateRecipeComment
} from "./recipe-comment.repository.js";
import type {
  CreateRecipeCommentInput,
  ListRecipeCommentsQuery,
  UpdateRecipeCommentInput
} from "./recipe-comment.schemas.js";

type RecipeRecord = NonNullable<Awaited<ReturnType<typeof getRecipeById>>>;
type RecipeCommentRecord = NonNullable<Awaited<ReturnType<typeof getRecipeCommentById>>>;

function toRecipeCommentDto(comment: RecipeCommentRecord, access: AccessContext): RecipeCommentDto {
  const canManage = isAdmin(access) || access.userId === comment.authorId;

  return {
    id: comment.id,
    recipeId: comment.recipeId,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      image: comment.author.image ?? null
    },
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.createdAt !== comment.updatedAt,
    canEdit: canManage,
    canDelete: canManage
  };
}

function ensureCommentManageable(comment: RecipeCommentRecord, access: AccessContext) {
  if (isAdmin(access)) {
    return;
  }

  if (access.userId !== comment.authorId) {
    throw new AppError(403, "COMMENT_FORBIDDEN", "You do not have permission to manage this comment");
  }
}

async function getReadableRecipeOrThrow(recipeId: string, access: AccessContext): Promise<RecipeRecord> {
  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    throw new AppError(404, "RECIPE_NOT_FOUND", `Recipe ${recipeId} was not found`);
  }

  ensureRecipeReadable(recipe, access);
  return recipe;
}

export async function getRecipeComments(
  recipeId: string,
  query: ListRecipeCommentsQuery,
  access: AccessContext
) {
  await getReadableRecipeOrThrow(recipeId, access);
  const pagination = normalizePagination(query.limit, query.offset);
  const result = await listRecipeComments(recipeId, pagination.limit, pagination.offset);

  return {
    items: result.items.map((comment) => toRecipeCommentDto(comment, access)),
    meta: {
      total: result.total,
      limit: pagination.limit,
      offset: pagination.offset
    }
  };
}

export async function createRecipeCommentEntry(
  recipeId: string,
  input: CreateRecipeCommentInput,
  access: AccessContext
) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to comment on recipes");
  await getReadableRecipeOrThrow(recipeId, authenticatedAccess);
  const comment = await createRecipeComment(recipeId, authenticatedAccess.userId, input);

  if (!comment) {
    throw new AppError(500, "COMMENT_CREATE_FAILED", "Comment could not be created");
  }

  return toRecipeCommentDto(comment, authenticatedAccess);
}

export async function updateRecipeCommentEntry(
  recipeId: string,
  commentId: string,
  input: UpdateRecipeCommentInput,
  access: AccessContext
) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to edit comments");
  await getReadableRecipeOrThrow(recipeId, authenticatedAccess);
  const existingComment = await getRecipeCommentById(commentId);

  if (!existingComment || existingComment.recipeId !== recipeId) {
    throw new AppError(404, "COMMENT_NOT_FOUND", `Comment ${commentId} was not found`);
  }

  ensureCommentManageable(existingComment, authenticatedAccess);
  const updatedComment = await updateRecipeComment(commentId, input);

  if (!updatedComment) {
    throw new AppError(500, "COMMENT_UPDATE_FAILED", "Comment could not be updated");
  }

  return toRecipeCommentDto(updatedComment, authenticatedAccess);
}

export async function deleteRecipeCommentEntry(
  recipeId: string,
  commentId: string,
  access: AccessContext
) {
  const authenticatedAccess = requireAuthenticated(access, "Sign in to delete comments");
  await getReadableRecipeOrThrow(recipeId, authenticatedAccess);
  const existingComment = await getRecipeCommentById(commentId);

  if (!existingComment || existingComment.recipeId !== recipeId) {
    throw new AppError(404, "COMMENT_NOT_FOUND", `Comment ${commentId} was not found`);
  }

  ensureCommentManageable(existingComment, authenticatedAccess);
  await deleteRecipeComment(commentId);

  return { ok: true as const };
}

export async function attachCommentCountsToRecipes<
  T extends {
    id: string;
    commentCount: number;
  }
>(recipes: T[]): Promise<T[]> {
  if (!recipes.length) {
    return recipes;
  }

  const counts = await listRecipeCommentCounts(recipes.map((recipe) => recipe.id));
  const countsByRecipeId = new Map(counts.map((countEntry) => [countEntry.recipeId, Number(countEntry.total)]));

  return recipes.map((recipe) => ({
    ...recipe,
    commentCount: countsByRecipeId.get(recipe.id) ?? 0
  }));
}
