import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text
} from "drizzle-orm/sqlite-core";

export const recipeStatusValues = ["draft", "published", "private", "archived"] as const;
export const shoppingListStatusValues = ["active", "archived"] as const;
export const shoppingListVisibilityValues = ["private", "public"] as const;
export const localeValues = ["en", "ru"] as const;

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    locale: text("locale", { enum: localeValues }).notNull().default("en"),
    role: text("role").default("user"),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("banReason"),
    banExpires: integer("banExpires", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email)
  })
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy")
  },
  (table) => ({
    tokenIdx: index("session_token_idx").on(table.token),
    userIdx: index("session_userId_idx").on(table.userId)
  })
);

export const account = sqliteTable(
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
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    userIdx: index("account_userId_idx").on(table.userId),
    providerAccountIdx: index("account_provider_account_idx").on(table.providerId, table.accountId)
  })
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier)
  })
);

export const recipes = sqliteTable(
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
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    titleIdx: index("recipes_title_idx").on(table.title),
    categoryIdx: index("recipes_category_idx").on(table.category),
    statusIdx: index("recipes_status_idx").on(table.status),
    ownerIdx: index("recipes_owner_idx").on(table.ownerId)
  })
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: real("amount"),
    unit: text("unit"),
    preparationNote: text("preparation_note"),
    optional: integer("optional", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => ({
    recipeIdx: index("recipe_ingredients_recipe_idx").on(table.recipeId)
  })
);

export const recipeSteps = sqliteTable(
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

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique()
});

export const recipeTagLinks = sqliteTable(
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

export const shoppingLists = sqliteTable(
  "shopping_lists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ownerId: text("owner_id"),
    status: text("status", { enum: shoppingListStatusValues }).notNull().default("active"),
    visibility: text("visibility", { enum: shoppingListVisibilityValues })
      .notNull()
      .default("private"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    statusIdx: index("shopping_lists_status_idx").on(table.status),
    visibilityIdx: index("shopping_lists_visibility_idx").on(table.visibility),
    ownerIdx: index("shopping_lists_owner_idx").on(table.ownerId)
  })
);

export const shoppingListItems = sqliteTable(
  "shopping_list_items",
  {
    id: text("id").primaryKey(),
    shoppingListId: text("shopping_list_id")
      .notNull()
      .references(() => shoppingLists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: real("amount"),
    unit: text("unit"),
    checked: integer("checked", { mode: "boolean" }).notNull().default(false),
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

export const recipeRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  tagLinks: many(recipeTagLinks)
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
