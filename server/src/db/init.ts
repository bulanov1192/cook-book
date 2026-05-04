import { sqliteClient } from "./client.js";

const bootstrapSql = `
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT DEFAULT 'user',
  banned INTEGER DEFAULT 0,
  banReason TEXT,
  banExpires INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS user_email_idx ON user (email);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL,
  impersonatedBy TEXT,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS session_userId_idx ON session (userId);
CREATE INDEX IF NOT EXISTS session_token_idx ON session (token);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_userId_idx ON account (userId);
CREATE INDEX IF NOT EXISTS account_provider_account_idx ON account (providerId, accountId);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  servings INTEGER NOT NULL,
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  total_minutes INTEGER,
  notes TEXT,
  owner_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recipes_title_idx ON recipes (title);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes (category);
CREATE INDEX IF NOT EXISTS recipes_status_idx ON recipes (status);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  preparation_note TEXT,
  optional INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_idx ON recipe_ingredients (recipe_id);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  instruction TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS recipe_steps_recipe_idx ON recipe_steps (recipe_id);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recipe_tag_links (
  recipe_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS shopping_lists_status_idx ON shopping_lists (status);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  shopping_list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  checked INTEGER NOT NULL DEFAULT 0,
  source_recipe_id TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (source_recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS shopping_list_items_list_idx ON shopping_list_items (shopping_list_id);
`;

const postMigrationSql = `
CREATE INDEX IF NOT EXISTS recipes_owner_idx ON recipes (owner_id);
CREATE INDEX IF NOT EXISTS shopping_lists_visibility_idx ON shopping_lists (visibility);
CREATE INDEX IF NOT EXISTS shopping_lists_owner_idx ON shopping_lists (owner_id);
`;

function hasColumn(tableName: string, columnName: string): boolean {
  const rows = sqliteClient
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  return rows.some((row) => row.name === columnName);
}

function ensureColumn(tableName: string, columnName: string, definition: string) {
  if (!hasColumn(tableName, columnName)) {
    sqliteClient.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition};`);
  }
}

export function initializeDatabase(): void {
  sqliteClient.exec(bootstrapSql);
  ensureColumn("recipes", "owner_id", "owner_id TEXT");
  ensureColumn("shopping_lists", "owner_id", "owner_id TEXT");
  ensureColumn("shopping_lists", "visibility", "visibility TEXT NOT NULL DEFAULT 'private'");
  ensureColumn("user", "role", "role TEXT DEFAULT 'user'");
  ensureColumn("user", "banned", "banned INTEGER DEFAULT 0");
  ensureColumn("user", "banReason", "banReason TEXT");
  ensureColumn("user", "banExpires", "banExpires TEXT");
  ensureColumn("session", "impersonatedBy", "impersonatedBy TEXT");
  sqliteClient.exec(postMigrationSql);
}
