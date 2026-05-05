CREATE TABLE IF NOT EXISTS "recipe_vote_summaries" (
  "recipe_id" TEXT PRIMARY KEY REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "upvote_count" INTEGER NOT NULL DEFAULT 0,
  "downvote_count" INTEGER NOT NULL DEFAULT 0,
  "score" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "recipe_votes" (
  "id" TEXT PRIMARY KEY,
  "recipe_id" TEXT NOT NULL REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "value" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "recipe_votes_recipe_idx" ON "recipe_votes" ("recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_votes_user_idx" ON "recipe_votes" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "recipe_votes_recipe_user_idx" ON "recipe_votes" ("recipe_id", "user_id");

CREATE TABLE IF NOT EXISTS "recipe_comments" (
  "id" TEXT PRIMARY KEY,
  "recipe_id" TEXT NOT NULL REFERENCES "recipes" ("id") ON DELETE CASCADE,
  "author_id" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "recipe_comments_recipe_created_idx" ON "recipe_comments" ("recipe_id", "created_at");
CREATE INDEX IF NOT EXISTS "recipe_comments_author_idx" ON "recipe_comments" ("author_id");
