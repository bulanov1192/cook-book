import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "../config/env.js";
import {
  createRecipeSchema,
  listRecipesQuerySchema,
  recipeIdParamsSchema,
  recipeStatusSchema,
  updateRecipeSchema
} from "../modules/recipes/recipe.schemas.js";
import {
  createRecipeCommentSchema,
  listRecipeCommentsQuerySchema,
  listRecipeCommentRepliesQuerySchema,
  recipeCommentIdParamsSchema,
  recipeCommentParamsSchema,
  updateRecipeCommentSchema
} from "../modules/recipe-comments/recipe-comment.schemas.js";
import { recipeVoteValueSchema, setRecipeVoteSchema } from "../modules/recipe-votes/recipe-vote.schemas.js";
import {
  createShoppingListItemSchema,
  createShoppingListSchema,
  importRecipeIntoShoppingListSchema,
  listShoppingListsQuerySchema,
  shoppingListIdParamsSchema,
  shoppingListItemIdParamsSchema,
  shoppingListStatusSchema,
  shoppingListVisibilitySchema,
  updateShoppingListItemSchema
} from "../modules/shopping-lists/shopping-list.schemas.js";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const recipeIngredientSchema = registry.register(
  "RecipeIngredient",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    amount: z.number().nullable(),
    unit: z.string().nullable(),
    preparationNote: z.string().nullable(),
    optional: z.boolean(),
    sortOrder: z.number().int()
  })
);

const recipeStepSchema = registry.register(
  "RecipeStep",
  z.object({
    id: z.string().uuid(),
    instruction: z.string(),
    sortOrder: z.number().int()
  })
);

const recipeSchema = registry.register(
  "Recipe",
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    category: z.string().nullable(),
    servings: z.number().int(),
    prepMinutes: z.number().int().nullable(),
    cookMinutes: z.number().int().nullable(),
    totalMinutes: z.number().int().nullable(),
    notes: z.string().nullable(),
    ownerId: z.string().nullable(),
    status: recipeStatusSchema,
    isOwner: z.boolean(),
    canEdit: z.boolean(),
    isPublic: z.boolean(),
    vote: z.object({
      upvoteCount: z.number().int().nonnegative(),
      downvoteCount: z.number().int().nonnegative(),
      score: z.number().int(),
      currentUserVote: recipeVoteValueSchema.nullable()
    }),
    tags: z.array(z.string()),
    ingredients: z.array(recipeIngredientSchema),
    steps: z.array(recipeStepSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const recipeListItemSchema = registry.register(
  "RecipeListItem",
  recipeSchema.omit({
    ingredients: true,
    steps: true
  }).extend({
    ingredientCount: z.number().int().nonnegative(),
    stepCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative()
  })
);

const recipeListResponseSchema = registry.register(
  "RecipeListResponse",
  z.object({
    items: z.array(recipeListItemSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative()
    })
  })
);

const categoryListResponseSchema = registry.register(
  "CategoryListResponse",
  z.object({
    items: z.array(z.string())
  })
);

const tagSchema = registry.register(
  "Tag",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string()
  })
);

const tagListResponseSchema = registry.register(
  "TagListResponse",
  z.object({
    items: z.array(tagSchema)
  })
);

const shoppingListItemSchema = registry.register(
  "ShoppingListItem",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    amount: z.number().nullable(),
    unit: z.string().nullable(),
    checked: z.boolean(),
    sourceRecipeId: z.string().uuid().nullable(),
    note: z.string().nullable(),
    sortOrder: z.number().int()
  })
);

const shoppingListSchema = registry.register(
  "ShoppingList",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.string().nullable(),
    status: shoppingListStatusSchema,
    visibility: shoppingListVisibilitySchema,
    isOwner: z.boolean(),
    canEdit: z.boolean(),
    isPublicReadable: z.boolean(),
    items: z.array(shoppingListItemSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const shoppingListListItemSchema = registry.register(
  "ShoppingListListItem",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    ownerId: z.string().nullable(),
    status: shoppingListStatusSchema,
    visibility: shoppingListVisibilitySchema,
    isOwner: z.boolean(),
    canEdit: z.boolean(),
    isPublicReadable: z.boolean(),
    itemCount: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
);

const shoppingListListResponseSchema = registry.register(
  "ShoppingListListResponse",
  z.object({
    items: z.array(shoppingListListItemSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative()
    })
  })
);

const recipeVoteSummarySchema = registry.register(
  "RecipeVoteSummary",
  z.object({
    upvoteCount: z.number().int().nonnegative(),
    downvoteCount: z.number().int().nonnegative(),
    score: z.number().int(),
    currentUserVote: recipeVoteValueSchema.nullable()
  })
);

const recipeCommentAuthorSchema = registry.register(
  "RecipeCommentAuthor",
  z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable()
  })
);

const recipeCommentSchema: z.ZodType = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    recipeId: z.string().uuid(),
    parentCommentId: z.string().uuid().nullable(),
    rootCommentId: z.string().uuid(),
    depth: z.number().int().nonnegative(),
    replyCount: z.number().int().nonnegative(),
    score: z.number().int(),
    author: recipeCommentAuthorSchema,
    body: z.string().nullable(),
    isDeleted: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    isEdited: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    loadedReplyCount: z.number().int().nonnegative(),
    hasMoreReplies: z.boolean(),
    previewReplies: z.array(recipeCommentSchema)
  })
);

registry.register("RecipeComment", recipeCommentSchema);

const recipeCommentListResponseSchema = registry.register(
  "RecipeCommentListResponse",
  z.object({
    items: z.array(recipeCommentSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
      offset: z.number().int().nonnegative()
    })
  })
);

const healthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.literal("ok"),
    timestamp: z.string().datetime()
  })
);

const apiIndexResponseSchema = registry.register(
  "ApiIndexResponse",
  z.object({
    name: z.literal("recipe-book-server"),
    status: z.literal("ok"),
    docs: z.object({
      swaggerUi: z.string(),
      openApiJson: z.string(),
      session: z.string(),
      auth: z.string(),
      health: z.string(),
      recipes: z.string(),
      shoppingLists: z.string()
    })
  })
);

const sessionResponseSchema = registry.register(
  "SessionResponse",
  z.object({
    session: z
      .object({
        id: z.string()
      })
      .nullable(),
    user: z
      .object({
        id: z.string(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["user", "admin"])
      })
      .nullable(),
    isAuthenticated: z.boolean()
  })
);

const validationErrorSchema = registry.register(
  "ValidationErrorResponse",
  z.object({
    error: z.object({
      code: z.literal("VALIDATION_ERROR"),
      message: z.string(),
      details: z.array(
        z.object({
          field: z.string(),
          message: z.string()
        })
      )
    })
  })
);

const genericErrorSchema = registry.register(
  "GenericErrorResponse",
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().nullable().optional()
    })
  })
);

function jsonContent(schema: z.ZodTypeAny) {
  return {
    "application/json": {
      schema
    }
  };
}

function standardErrorResponses(options?: { includeValidation?: boolean; includeNotFound?: boolean }) {
  const responses: Record<string, { description: string; content: ReturnType<typeof jsonContent> }> = {
    500: {
      description: "Unexpected server error",
      content: jsonContent(genericErrorSchema)
    }
  };

  if (options?.includeValidation) {
    responses[400] = {
      description: "Request validation failed",
      content: jsonContent(validationErrorSchema)
    };
  }

  if (options?.includeNotFound) {
    responses[404] = {
      description: "Requested resource was not found",
      content: jsonContent(genericErrorSchema)
    };
  }

  return responses;
}

registry.registerPath({
  method: "get",
  path: "/",
  tags: ["System"],
  summary: "API index",
  description: "Returns a short index with useful API entry points.",
  responses: {
    200: {
      description: "API entry point",
      content: jsonContent(apiIndexResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "get",
  path: "/api/session",
  tags: ["Auth"],
  summary: "Get current session",
  description: "Returns the currently resolved application session and effective user role.",
  responses: {
    200: {
      description: "Session state",
      content: jsonContent(sessionResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["System"],
  summary: "Health check",
  description: "Simple liveness probe for the API server.",
  responses: {
    200: {
      description: "Server is healthy",
      content: jsonContent(healthResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes",
  tags: ["Recipes"],
  summary: "List recipes",
  description:
    "Returns recipes with filtering, sorting and pagination. Unauthenticated users only see published recipes; authenticated users also see their own private, draft and archived entries.",
  request: {
    query: listRecipesQuerySchema
  },
  responses: {
    200: {
      description: "Recipe list",
      content: jsonContent(recipeListResponseSchema)
    },
    ...standardErrorResponses({ includeValidation: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/recipes",
  tags: ["Recipes"],
  summary: "Create recipe",
  description: "Creates a new recipe owned by the authenticated user.",
  request: {
    body: {
      description: "Recipe payload",
      required: true,
      content: jsonContent(createRecipeSchema)
    }
  },
  responses: {
    201: {
      description: "Recipe created",
      content: jsonContent(recipeSchema)
    },
    ...standardErrorResponses({ includeValidation: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/categories",
  tags: ["Recipes"],
  summary: "List categories",
  description: "Returns distinct categories from recipes visible to the current user.",
  responses: {
    200: {
      description: "Category list",
      content: jsonContent(categoryListResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/tags",
  tags: ["Recipes"],
  summary: "List tags",
  description: "Returns recipe tags that are visible to the current user.",
  responses: {
    200: {
      description: "Tag list",
      content: jsonContent(tagListResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/{id}",
  tags: ["Recipes"],
  summary: "Get recipe by id",
  request: {
    params: recipeIdParamsSchema
  },
  responses: {
    200: {
      description: "Single recipe",
      content: jsonContent(recipeSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/recipes/{id}",
  tags: ["Recipes"],
  summary: "Update recipe",
  description: "Partially updates recipe fields. If ingredients, steps or tags are sent, they replace the full collection.",
  request: {
    params: recipeIdParamsSchema,
    body: {
      description: "Partial recipe payload",
      required: true,
      content: jsonContent(updateRecipeSchema)
    }
  },
  responses: {
    200: {
      description: "Updated recipe",
      content: jsonContent(recipeSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/recipes/{id}/archive",
  tags: ["Recipes"],
  summary: "Archive recipe",
  request: {
    params: recipeIdParamsSchema
  },
  responses: {
    200: {
      description: "Archived recipe",
      content: jsonContent(recipeSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/recipes/{id}/restore",
  tags: ["Recipes"],
  summary: "Restore recipe",
  request: {
    params: recipeIdParamsSchema
  },
  responses: {
    200: {
      description: "Restored recipe",
      content: jsonContent(recipeSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/{id}/vote",
  tags: ["Recipes"],
  summary: "Get recipe vote summary",
  request: {
    params: recipeIdParamsSchema
  },
  responses: {
    200: {
      description: "Recipe vote summary",
      content: jsonContent(recipeVoteSummarySchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "put",
  path: "/api/recipes/{id}/vote",
  tags: ["Recipes"],
  summary: "Create or update current user vote",
  request: {
    params: recipeIdParamsSchema,
    body: {
      description: "Recipe vote payload",
      required: true,
      content: jsonContent(setRecipeVoteSchema)
    }
  },
  responses: {
    200: {
      description: "Updated recipe vote summary",
      content: jsonContent(recipeVoteSummarySchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/recipes/{id}/vote",
  tags: ["Recipes"],
  summary: "Clear current user vote",
  request: {
    params: recipeIdParamsSchema
  },
  responses: {
    200: {
      description: "Cleared recipe vote summary",
      content: jsonContent(recipeVoteSummarySchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/{id}/comments",
  tags: ["Recipes"],
  summary: "List recipe comments",
  request: {
    params: recipeCommentParamsSchema,
    query: listRecipeCommentsQuerySchema
  },
  responses: {
    200: {
      description: "Recipe comments",
      content: jsonContent(recipeCommentListResponseSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/recipes/{id}/comments",
  tags: ["Recipes"],
  summary: "Create recipe comment",
  request: {
    params: recipeCommentParamsSchema,
    body: {
      description: "Recipe comment payload",
      required: true,
      content: jsonContent(createRecipeCommentSchema)
    }
  },
  responses: {
    201: {
      description: "Recipe comment created",
      content: jsonContent(recipeCommentSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/recipes/{id}/comments/{commentId}/replies",
  tags: ["Recipes"],
  summary: "List direct replies for a recipe comment",
  request: {
    params: recipeCommentIdParamsSchema,
    query: listRecipeCommentRepliesQuerySchema
  },
  responses: {
    200: {
      description: "Direct reply page with nested preview replies",
      content: jsonContent(recipeCommentListResponseSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/recipes/{id}/comments/{commentId}",
  tags: ["Recipes"],
  summary: "Update recipe comment",
  request: {
    params: recipeCommentIdParamsSchema,
    body: {
      description: "Updated recipe comment payload",
      required: true,
      content: jsonContent(updateRecipeCommentSchema)
    }
  },
  responses: {
    200: {
      description: "Updated recipe comment",
      content: jsonContent(recipeCommentSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/recipes/{id}/comments/{commentId}",
  tags: ["Recipes"],
  summary: "Delete recipe comment",
  request: {
    params: recipeCommentIdParamsSchema
  },
  responses: {
    200: {
      description: "Comment deleted",
      content: jsonContent(recipeCommentSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/shopping-lists",
  tags: ["Shopping Lists"],
  summary: "List shopping lists",
  description: "Returns shopping lists owned by the authenticated user. Admins can see every list.",
  request: {
    query: listShoppingListsQuerySchema
  },
  responses: {
    200: {
      description: "Shopping list overview",
      content: jsonContent(shoppingListListResponseSchema)
    },
    ...standardErrorResponses()
  }
});

registry.registerPath({
  method: "post",
  path: "/api/shopping-lists",
  tags: ["Shopping Lists"],
  summary: "Create shopping list",
  description: "Creates a shopping list owned by the authenticated user.",
  request: {
    body: {
      description: "Shopping list payload",
      required: true,
      content: jsonContent(createShoppingListSchema)
    }
  },
  responses: {
    201: {
      description: "Shopping list created",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true })
  }
});

registry.registerPath({
  method: "get",
  path: "/api/shopping-lists/{id}",
  tags: ["Shopping Lists"],
  summary: "Get shopping list by id",
  description: "Public lists are readable by anyone; private lists are readable only by the owner or an admin.",
  request: {
    params: shoppingListIdParamsSchema
  },
  responses: {
    200: {
      description: "Single shopping list",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/shopping-lists/{id}/items",
  tags: ["Shopping Lists"],
  summary: "Add shopping list item",
  request: {
    params: shoppingListIdParamsSchema,
    body: {
      description: "Shopping list item payload",
      required: true,
      content: jsonContent(createShoppingListItemSchema)
    }
  },
  responses: {
    200: {
      description: "Updated shopping list",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/shopping-lists/{id}/items/{itemId}",
  tags: ["Shopping Lists"],
  summary: "Update shopping list item",
  request: {
    params: shoppingListItemIdParamsSchema,
    body: {
      description: "Partial shopping list item payload",
      required: true,
      content: jsonContent(updateShoppingListItemSchema)
    }
  },
  responses: {
    200: {
      description: "Updated shopping list",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/shopping-lists/{id}/items/{itemId}",
  tags: ["Shopping Lists"],
  summary: "Delete shopping list item",
  request: {
    params: shoppingListItemIdParamsSchema
  },
  responses: {
    200: {
      description: "Updated shopping list",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

registry.registerPath({
  method: "post",
  path: "/api/shopping-lists/{id}/import-recipe",
  tags: ["Shopping Lists"],
  summary: "Import recipe ingredients into shopping list",
  description: "Copies the ingredient lines from a recipe into the selected shopping list.",
  request: {
    params: shoppingListIdParamsSchema,
    body: {
      description: "Recipe import payload",
      required: true,
      content: jsonContent(importRecipeIntoShoppingListSchema)
    }
  },
  responses: {
    200: {
      description: "Updated shopping list",
      content: jsonContent(shoppingListSchema)
    },
    ...standardErrorResponses({ includeValidation: true, includeNotFound: true })
  }
});

export function createOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Recipe Book API",
      version: "0.1.0",
      description:
        "API for managing recipes, categories, tags and shopping lists in the recipe book app."
    },
    servers: [
      {
        url: "/",
        description: "Current origin"
      },
      {
        url: env.BETTER_AUTH_URL,
        description: "Configured application origin"
      }
    ],
    tags: [
      { name: "System", description: "Service metadata and health probes" },
      { name: "Auth", description: "Session and authentication-related endpoints" },
      { name: "Recipes", description: "Recipe catalog, voting and comments endpoints" },
      { name: "Shopping Lists", description: "Shopping list management endpoints" }
    ]
  });
}
