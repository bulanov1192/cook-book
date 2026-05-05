import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const recipeStatusValues = ["draft", "published", "private", "archived"] as const;
export const shoppingListStatusValues = ["active", "archived"] as const;
export const shoppingListVisibilityValues = ["private", "public"] as const;
export const localeValues = ["en", "ru"] as const;
export const recipeVoteValues = ["up", "down"] as const;

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    locale: text("locale", { enum: localeValues }).notNull().default("en"),
    role: text("role").default("user"),
    banned: boolean("banned").default(false),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email)
  })
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy")
  },
  (table) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(table.token),
    userIdx: index("session_userId_idx").on(table.userId)
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      withTimezone: true,
      mode: "date"
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      withTimezone: true,
      mode: "date"
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => ({
    userIdx: index("account_userId_idx").on(table.userId),
    providerAccountIdx: index("account_provider_account_idx").on(table.providerId, table.accountId)
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier)
  })
);

export const recipes = pgTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    servings: integer("servings").notNull(),
    prepMinutes: integer("prep_minutes"),
    cookMinutes: integer("cook_minutes"),
    totalMinutes: integer("total_minutes"),
    notes: text("notes"),
    ownerId: text("owner_id"),
    status: text("status", { enum: recipeStatusValues }).notNull().default("draft"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    titleIdx: index("recipes_title_idx").on(table.title),
    categoryIdx: index("recipes_category_idx").on(table.category),
    statusIdx: index("recipes_status_idx").on(table.status),
    ownerIdx: index("recipes_owner_idx").on(table.ownerId)
  })
);

export const recipeVoteSummaries = pgTable("recipe_vote_summaries", {
  recipeId: text("recipe_id")
    .primaryKey()
    .references(() => recipes.id, { onDelete: "cascade" }),
  upvoteCount: integer("upvote_count").notNull().default(0),
  downvoteCount: integer("downvote_count").notNull().default(0),
  score: integer("score").notNull().default(0),
  updatedAt: text("updated_at").notNull()
});

export const recipeVotes = pgTable(
  "recipe_votes",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: text("value", { enum: recipeVoteValues }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    recipeIdx: index("recipe_votes_recipe_idx").on(table.recipeId),
    userIdx: index("recipe_votes_user_idx").on(table.userId),
    recipeUserIdx: uniqueIndex("recipe_votes_recipe_user_idx").on(table.recipeId, table.userId)
  })
);

export const recipeComments = pgTable(
  "recipe_comments",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    parentCommentId: text("parent_comment_id").references((): AnyPgColumn => recipeComments.id, {
      onDelete: "set null"
    }),
    rootCommentId: text("root_comment_id")
      .notNull()
      .references((): AnyPgColumn => recipeComments.id, { onDelete: "cascade" }),
    depth: integer("depth").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    score: integer("score").notNull().default(0),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    recipeCreatedIdx: index("recipe_comments_recipe_created_idx").on(table.recipeId, table.createdAt),
    recipeParentCreatedIdx: index("recipe_comments_recipe_parent_created_idx").on(
      table.recipeId,
      table.parentCommentId,
      table.createdAt
    ),
    rootCreatedIdx: index("recipe_comments_root_created_idx").on(table.rootCommentId, table.createdAt),
    parentIdx: index("recipe_comments_parent_idx").on(table.parentCommentId),
    authorIdx: index("recipe_comments_author_idx").on(table.authorId)
  })
);

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: doublePrecision("amount"),
    unit: text("unit"),
    preparationNote: text("preparation_note"),
    optional: boolean("optional").notNull().default(false),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => ({
    recipeIdx: index("recipe_ingredients_recipe_idx").on(table.recipeId)
  })
);

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    instruction: text("instruction").notNull(),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => ({
    recipeIdx: index("recipe_steps_recipe_idx").on(table.recipeId)
  })
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull()
  },
  (table) => ({
    slugIdx: uniqueIndex("tags_slug_idx").on(table.slug)
  })
);

export const recipeTagLinks = pgTable(
  "recipe_tag_links",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" })
  },
  (table) => ({
    pk: primaryKey({ columns: [table.recipeId, table.tagId] })
  })
);

export const shoppingLists = pgTable(
  "shopping_lists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerId: text("owner_id"),
    status: text("status", { enum: shoppingListStatusValues }).notNull().default("active"),
    visibility: text("visibility", { enum: shoppingListVisibilityValues })
      .notNull()
      .default("private"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    statusIdx: index("shopping_lists_status_idx").on(table.status),
    visibilityIdx: index("shopping_lists_visibility_idx").on(table.visibility),
    ownerIdx: index("shopping_lists_owner_idx").on(table.ownerId)
  })
);

export const shoppingListItems = pgTable(
  "shopping_list_items",
  {
    id: text("id").primaryKey(),
    shoppingListId: text("shopping_list_id")
      .notNull()
      .references(() => shoppingLists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: doublePrecision("amount"),
    unit: text("unit"),
    checked: boolean("checked").notNull().default(false),
    sourceRecipeId: text("source_recipe_id").references(() => recipes.id, {
      onDelete: "set null"
    }),
    note: text("note"),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => ({
    listIdx: index("shopping_list_items_list_idx").on(table.shoppingListId)
  })
);

export const recipeRelations = relations(recipes, ({ many, one }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  tagLinks: many(recipeTagLinks),
  votes: many(recipeVotes),
  comments: many(recipeComments),
  voteSummary: one(recipeVoteSummaries, {
    fields: [recipes.id],
    references: [recipeVoteSummaries.recipeId]
  })
}));

export const recipeVoteSummaryRelations = relations(recipeVoteSummaries, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeVoteSummaries.recipeId],
    references: [recipes.id]
  })
}));

export const recipeVoteRelations = relations(recipeVotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeVotes.recipeId],
    references: [recipes.id]
  }),
  author: one(user, {
    fields: [recipeVotes.userId],
    references: [user.id]
  })
}));

export const recipeCommentRelations = relations(recipeComments, ({ many, one }) => ({
  recipe: one(recipes, {
    fields: [recipeComments.recipeId],
    references: [recipes.id]
  }),
  author: one(user, {
    fields: [recipeComments.authorId],
    references: [user.id]
  }),
  parent: one(recipeComments, {
    fields: [recipeComments.parentCommentId],
    references: [recipeComments.id],
    relationName: "recipe_comment_parent"
  }),
  root: one(recipeComments, {
    fields: [recipeComments.rootCommentId],
    references: [recipeComments.id],
    relationName: "recipe_comment_root"
  }),
  replies: many(recipeComments, {
    relationName: "recipe_comment_parent"
  }),
  threadComments: many(recipeComments, {
    relationName: "recipe_comment_root"
  })
}));

export const recipeIngredientRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id]
  })
}));

export const recipeStepRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipeId],
    references: [recipes.id]
  })
}));

export const tagRelations = relations(tags, ({ many }) => ({
  recipeLinks: many(recipeTagLinks)
}));

export const recipeTagLinkRelations = relations(recipeTagLinks, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTagLinks.recipeId],
    references: [recipes.id]
  }),
  tag: one(tags, {
    fields: [recipeTagLinks.tagId],
    references: [tags.id]
  })
}));

export const shoppingListRelations = relations(shoppingLists, ({ many }) => ({
  items: many(shoppingListItems)
}));

export const shoppingListItemRelations = relations(shoppingListItems, ({ one }) => ({
  shoppingList: one(shoppingLists, {
    fields: [shoppingListItems.shoppingListId],
    references: [shoppingLists.id]
  }),
  sourceRecipe: one(recipes, {
    fields: [shoppingListItems.sourceRecipeId],
    references: [recipes.id]
  })
}));
