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
  incrementRecipeCommentReplyCount,
  listRecipeCommentCounts,
  listRecipeComments,
  listRecipeCommentsByParentIds,
  listRecipeCommentReplies,
  updateRecipeComment
} from "./recipe-comment.repository.js";
import type {
  CreateRecipeCommentInput,
  ListRecipeCommentsQuery,
  ListRecipeCommentRepliesQuery,
  UpdateRecipeCommentInput
} from "./recipe-comment.schemas.js";

type RecipeRecord = NonNullable<Awaited<ReturnType<typeof getRecipeById>>>;
type RecipeCommentRecord = NonNullable<Awaited<ReturnType<typeof getRecipeCommentById>>>;

const COMMENT_PREVIEW_LEVEL_LIMITS = [3, 2, 1] as const;
const COMMENT_PREVIEW_NODE_BUDGET = 120;
const COMMENT_REPLY_PAGE_LIMIT = 10;

function toRecipeCommentDto(comment: RecipeCommentRecord, access: AccessContext): RecipeCommentDto {
  const canManage = !comment.deletedAt && (isAdmin(access) || access.userId === comment.authorId);

  return {
    id: comment.id,
    recipeId: comment.recipeId,
    parentCommentId: comment.parentCommentId ?? null,
    rootCommentId: comment.rootCommentId,
    depth: comment.depth,
    replyCount: comment.replyCount,
    score: comment.score,
    author: {
      id: comment.author.id,
      name: comment.author.name,
      image: comment.author.image ?? null
    },
    body: comment.deletedAt ? null : comment.body,
    isDeleted: Boolean(comment.deletedAt),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isEdited: comment.createdAt !== comment.updatedAt && !comment.deletedAt,
    canEdit: canManage,
    canDelete: canManage,
    previewReplies: [],
    loadedReplyCount: 0,
    hasMoreReplies: comment.replyCount > 0
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

async function attachPreviewRepliesToComments(
  recipeId: string,
  comments: RecipeCommentDto[],
  access: AccessContext,
  options: {
    nodeBudget?: number;
  } = {}
) {
  if (!comments.length) {
    return comments;
  }

  let remainingBudget = options.nodeBudget ?? COMMENT_PREVIEW_NODE_BUDGET;
  let currentLevel = comments;

  for (const previewLimit of COMMENT_PREVIEW_LEVEL_LIMITS) {
    if (!currentLevel.length || remainingBudget <= 0) {
      break;
    }

    const children = await listRecipeCommentsByParentIds(
      recipeId,
      currentLevel.map((comment) => comment.id)
    );

    if (!children.length) {
      break;
    }

    const childrenByParentId = new Map<string, RecipeCommentRecord[]>();

    for (const child of children) {
      const bucket = childrenByParentId.get(child.parentCommentId ?? "");

      if (bucket) {
        bucket.push(child);
      } else {
        childrenByParentId.set(child.parentCommentId ?? "", [child]);
      }
    }

    const nextLevel: RecipeCommentDto[] = [];

    for (const parent of currentLevel) {
      const availableChildren = childrenByParentId.get(parent.id) ?? [];
      const selectedCount = Math.min(previewLimit, availableChildren.length, remainingBudget);
      const selectedChildren = availableChildren
        .slice(0, selectedCount)
        .map((child) => toRecipeCommentDto(child, access));

      parent.previewReplies = selectedChildren;
      parent.loadedReplyCount = selectedChildren.length;
      parent.hasMoreReplies = parent.replyCount > parent.loadedReplyCount;
      remainingBudget -= selectedChildren.length;
      nextLevel.push(...selectedChildren);

      if (remainingBudget <= 0) {
        break;
      }
    }

    currentLevel = nextLevel;
  }

  return comments;
}

export async function getRecipeComments(
  recipeId: string,
  query: ListRecipeCommentsQuery,
  access: AccessContext
) {
  await getReadableRecipeOrThrow(recipeId, access);
  const pagination = normalizePagination(query.limit, query.offset);
  const result = await listRecipeComments(recipeId, pagination.limit, pagination.offset);
  const items = await attachPreviewRepliesToComments(
    recipeId,
    result.items.map((comment) => toRecipeCommentDto(comment, access)),
    access
  );

  return {
    items,
    meta: {
      total: result.total,
      limit: pagination.limit,
      offset: pagination.offset
    }
  };
}

export async function getRecipeCommentReplies(
  recipeId: string,
  commentId: string,
  query: ListRecipeCommentRepliesQuery,
  access: AccessContext
) {
  await getReadableRecipeOrThrow(recipeId, access);
  const parentComment = await getRecipeCommentById(commentId);

  if (!parentComment || parentComment.recipeId !== recipeId) {
    throw new AppError(404, "COMMENT_NOT_FOUND", `Comment ${commentId} was not found`);
  }

  const pagination = normalizePagination(query.limit ?? COMMENT_REPLY_PAGE_LIMIT, query.offset);
  const result = await listRecipeCommentReplies(recipeId, commentId, pagination.limit, pagination.offset);
  const items = await attachPreviewRepliesToComments(
    recipeId,
    result.items.map((comment) => toRecipeCommentDto(comment, access)),
    access
  );

  return {
    items,
    meta: {
      total: parentComment.replyCount,
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
  const timestamp = new Date().toISOString();
  const commentId = crypto.randomUUID();
  let parentCommentId: string | null = null;
  let rootCommentId: string = commentId;
  let depth = 0;

  if (input.parentCommentId) {
    const parentComment = await getRecipeCommentById(input.parentCommentId);

    if (!parentComment || parentComment.recipeId !== recipeId) {
      throw new AppError(404, "COMMENT_NOT_FOUND", `Comment ${input.parentCommentId} was not found`);
    }

    parentCommentId = parentComment.id;
    rootCommentId = parentComment.rootCommentId;
    depth = parentComment.depth + 1;
  }

  const comment = await createRecipeComment({
    id: commentId,
    recipeId,
    authorId: authenticatedAccess.userId,
    body: input.body,
    parentCommentId,
    rootCommentId,
    depth,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (!comment) {
    throw new AppError(500, "COMMENT_CREATE_FAILED", "Comment could not be created");
  }

  if (parentCommentId) {
    await incrementRecipeCommentReplyCount(parentCommentId);
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

  if (existingComment.deletedAt) {
    throw new AppError(409, "COMMENT_DELETED", "Deleted comments cannot be edited");
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
  const deletedComment = await deleteRecipeComment(commentId);

  if (!deletedComment) {
    throw new AppError(500, "COMMENT_DELETE_FAILED", "Comment could not be deleted");
  }

  return toRecipeCommentDto(deletedComment, authenticatedAccess);
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
