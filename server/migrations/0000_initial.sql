CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "role" TEXT DEFAULT 'user',
  "banned" BOOLEAN DEFAULT FALSE,
  "banReason" TEXT,
  "banExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_idx" ON "user" ("email");

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "impersonatedBy" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_idx" ON "session" ("token");
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "account_provider_account_idx" ON "account" ("providerId", "accountId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "recipes" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "servings" INTEGER NOT NULL,
  "prep_minutes" INTEGER,
  "cook_minutes" INTEGER,
  "total_minutes" INTEGER,
  "notes" TEXT,
  "owner_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "recipes_title_idx" ON "recipes" ("title");
CREATE INDEX IF NOT EXISTS "recipes_category_idx" ON "recipes" ("category");
CREATE INDEX IF NOT EXISTS "recipes_status_idx" ON "recipes" ("status");
CREATE INDEX IF NOT EXISTS "recipes_owner_idx" ON "recipes" ("owner_id");

CREATE TABLE IF NOT EXISTS "recipe_ingredients" (
  "id" TEXT PRIMARY KEY,
  "recipe_id" TEXT NOT NULL REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION,
  "unit" TEXT,
  "preparation_note" TEXT,
  "optional" BOOLEAN NOT NULL DEFAULT FALSE,
  "sort_order" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "recipe_ingredients_recipe_idx" ON "recipe_ingredients" ("recipe_id");

CREATE TABLE IF NOT EXISTS "recipe_steps" (
  "id" TEXT PRIMARY KEY,
  "recipe_id" TEXT NOT NULL REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "instruction" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "recipe_steps_recipe_idx" ON "recipe_steps" ("recipe_id");

CREATE TABLE IF NOT EXISTS "tags" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" ("slug");

CREATE TABLE IF NOT EXISTS "recipe_tag_links" (
  "recipe_id" TEXT NOT NULL REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "tag_id" TEXT NOT NULL REFERENCES "tags" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("recipe_id", "tag_id")
);

CREATE TABLE IF NOT EXISTS "shopping_lists" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "owner_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "shopping_lists_status_idx" ON "shopping_lists" ("status");
CREATE INDEX IF NOT EXISTS "shopping_lists_visibility_idx" ON "shopping_lists" ("visibility");
CREATE INDEX IF NOT EXISTS "shopping_lists_owner_idx" ON "shopping_lists" ("owner_id");

CREATE TABLE IF NOT EXISTS "shopping_list_items" (
  "id" TEXT PRIMARY KEY,
  "shopping_list_id" TEXT NOT NULL REFERENCES "shopping_lists" ("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION,
  "unit" TEXT,
  "checked" BOOLEAN NOT NULL DEFAULT FALSE,
  "source_recipe_id" TEXT REFERENCES "recipes" ("id") ON DELETE SET NULL,
  "note" TEXT,
  "sort_order" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "shopping_list_items_list_idx" ON "shopping_list_items" ("shopping_list_id");
