ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "parent_comment_id" TEXT REFERENCES "recipe_comments" ("id") ON DELETE SET NULL;

ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "root_comment_id" TEXT REFERENCES "recipe_comments" ("id") ON DELETE CASCADE;

ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "depth" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "reply_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "recipe_comments"
  ADD COLUMN IF NOT EXISTS "deleted_at" TEXT;

UPDATE "recipe_comments"
SET "root_comment_id" = "id"
WHERE "root_comment_id" IS NULL;

ALTER TABLE "recipe_comments"
  ALTER COLUMN "root_comment_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "recipe_comments_recipe_parent_created_idx"
  ON "recipe_comments" ("recipe_id", "parent_comment_id", "created_at");

CREATE INDEX IF NOT EXISTS "recipe_comments_root_created_idx"
  ON "recipe_comments" ("root_comment_id", "created_at");

CREATE INDEX IF NOT EXISTS "recipe_comments_parent_idx"
  ON "recipe_comments" ("parent_comment_id");
