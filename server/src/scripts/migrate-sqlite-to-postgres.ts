import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import type { PoolClient } from "pg";
import { env } from "../config/env.js";
import { pool } from "../db/client.js";
import { initializeDatabase } from "../db/init.js";

const orderedTables = [
  "user",
  "session",
  "account",
  "verification",
  "recipes",
  "recipe_ingredients",
  "recipe_steps",
  "tags",
  "recipe_tag_links",
  "shopping_lists",
  "shopping_list_items"
] as const;

type TableName = (typeof orderedTables)[number];

type SqliteUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: number | boolean;
  image: string | null;
  locale: "en" | "ru" | null;
  role: string | null;
  banned: number | boolean | null;
  banReason: string | null;
  banExpires: number | null;
  createdAt: number;
  updatedAt: number;
};

type SqliteSessionRow = {
  id: string;
  expiresAt: number;
  token: string;
  createdAt: number;
  updatedAt: number;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  impersonatedBy: string | null;
};

type SqliteAccountRow = {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  scope: string | null;
  password: string | null;
  createdAt: number;
  updatedAt: number;
};

type SqliteVerificationRow = {
  id: string;
  identifier: string;
  value: string;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
};

type SqliteRecipeRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  notes: string | null;
  owner_id: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type SqliteRecipeIngredientRow = {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  preparation_note: string | null;
  optional: number | boolean;
  sort_order: number;
};

type SqliteRecipeStepRow = {
  id: string;
  recipe_id: string;
  instruction: string;
  sort_order: number;
};

type SqliteTagRow = {
  id: string;
  name: string;
  slug: string;
};

type SqliteRecipeTagLinkRow = {
  recipe_id: string;
  tag_id: string;
};

type SqliteShoppingListRow = {
  id: string;
  name: string;
  owner_id: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  updated_at: string;
};

type SqliteShoppingListItemRow = {
  id: string;
  shopping_list_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: number | boolean;
  source_recipe_id: string | null;
  note: string | null;
  sort_order: number;
};

function toBoolean(value: number | boolean | null | undefined): boolean {
  return Boolean(value);
}

function toDate(value: number | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return new Date(value);
}

async function ensureTargetIsEmpty(client: PoolClient) {
  for (const tableName of orderedTables) {
    const result = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "${tableName}"`);
    const rowCount = Number(result.rows[0]?.count ?? "0");

    if (rowCount > 0) {
      throw new Error(
        `Target PostgreSQL table "${tableName}" is not empty. Aborting SQLite import to avoid duplicates.`
      );
    }
  }
}

async function insertRow(
  client: PoolClient,
  tableName: TableName,
  columns: string[],
  values: Array<string | number | boolean | Date | null>
) {
  const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

  await client.query(
    `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`,
    values
  );
}

function logTableCount(tableName: TableName, count: number) {
  // eslint-disable-next-line no-console
  console.log(`${tableName}: ${count}`);
}

async function importUsers(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite.prepare("SELECT * FROM user ORDER BY id").all() as SqliteUserRow[];
  logTableCount("user", rows.length);

  for (const row of rows) {
    await insertRow(client, "user", [
      "id",
      "name",
      "email",
      "emailVerified",
      "image",
      "locale",
      "role",
      "banned",
      "banReason",
      "banExpires",
      "createdAt",
      "updatedAt"
    ], [
      row.id,
      row.name,
      row.email,
      toBoolean(row.emailVerified),
      row.image,
      row.locale ?? "en",
      row.role ?? "user",
      row.banned === null ? false : toBoolean(row.banned),
      row.banReason,
      toDate(row.banExpires),
      toDate(row.createdAt),
      toDate(row.updatedAt)
    ]);
  }
}

async function importSessions(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite.prepare("SELECT * FROM session ORDER BY id").all() as SqliteSessionRow[];
  logTableCount("session", rows.length);

  for (const row of rows) {
    await insertRow(client, "session", [
      "id",
      "expiresAt",
      "token",
      "createdAt",
      "updatedAt",
      "ipAddress",
      "userAgent",
      "userId",
      "impersonatedBy"
    ], [
      row.id,
      toDate(row.expiresAt),
      row.token,
      toDate(row.createdAt),
      toDate(row.updatedAt),
      row.ipAddress,
      row.userAgent,
      row.userId,
      row.impersonatedBy
    ]);
  }
}

async function importAccounts(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite.prepare("SELECT * FROM account ORDER BY id").all() as SqliteAccountRow[];
  logTableCount("account", rows.length);

  for (const row of rows) {
    await insertRow(client, "account", [
      "id",
      "accountId",
      "providerId",
      "userId",
      "accessToken",
      "refreshToken",
      "idToken",
      "accessTokenExpiresAt",
      "refreshTokenExpiresAt",
      "scope",
      "password",
      "createdAt",
      "updatedAt"
    ], [
      row.id,
      row.accountId,
      row.providerId,
      row.userId,
      row.accessToken,
      row.refreshToken,
      row.idToken,
      toDate(row.accessTokenExpiresAt),
      toDate(row.refreshTokenExpiresAt),
      row.scope,
      row.password,
      toDate(row.createdAt),
      toDate(row.updatedAt)
    ]);
  }
}

async function importVerifications(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM verification ORDER BY id")
    .all() as SqliteVerificationRow[];
  logTableCount("verification", rows.length);

  for (const row of rows) {
    await insertRow(client, "verification", [
      "id",
      "identifier",
      "value",
      "expiresAt",
      "createdAt",
      "updatedAt"
    ], [
      row.id,
      row.identifier,
      row.value,
      toDate(row.expiresAt),
      toDate(row.createdAt),
      toDate(row.updatedAt)
    ]);
  }
}

async function importRecipes(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite.prepare("SELECT * FROM recipes ORDER BY id").all() as SqliteRecipeRow[];
  logTableCount("recipes", rows.length);

  for (const row of rows) {
    await insertRow(client, "recipes", [
      "id",
      "title",
      "description",
      "category",
      "servings",
      "prep_minutes",
      "cook_minutes",
      "total_minutes",
      "notes",
      "owner_id",
      "status",
      "created_at",
      "updated_at"
    ], [
      row.id,
      row.title,
      row.description,
      row.category,
      row.servings,
      row.prep_minutes,
      row.cook_minutes,
      row.total_minutes,
      row.notes,
      row.owner_id,
      row.status ?? "draft",
      row.created_at,
      row.updated_at
    ]);
  }
}

async function importRecipeIngredients(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM recipe_ingredients ORDER BY recipe_id, sort_order, id")
    .all() as SqliteRecipeIngredientRow[];
  logTableCount("recipe_ingredients", rows.length);

  for (const row of rows) {
    await insertRow(client, "recipe_ingredients", [
      "id",
      "recipe_id",
      "name",
      "amount",
      "unit",
      "preparation_note",
      "optional",
      "sort_order"
    ], [
      row.id,
      row.recipe_id,
      row.name,
      row.amount,
      row.unit,
      row.preparation_note,
      toBoolean(row.optional),
      row.sort_order
    ]);
  }
}

async function importRecipeSteps(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM recipe_steps ORDER BY recipe_id, sort_order, id")
    .all() as SqliteRecipeStepRow[];
  logTableCount("recipe_steps", rows.length);

  for (const row of rows) {
    await insertRow(client, "recipe_steps", ["id", "recipe_id", "instruction", "sort_order"], [
      row.id,
      row.recipe_id,
      row.instruction,
      row.sort_order
    ]);
  }
}

async function importTags(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite.prepare("SELECT * FROM tags ORDER BY id").all() as SqliteTagRow[];
  logTableCount("tags", rows.length);

  for (const row of rows) {
    await insertRow(client, "tags", ["id", "name", "slug"], [row.id, row.name, row.slug]);
  }
}

async function importRecipeTagLinks(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM recipe_tag_links ORDER BY recipe_id, tag_id")
    .all() as SqliteRecipeTagLinkRow[];
  logTableCount("recipe_tag_links", rows.length);

  for (const row of rows) {
    await insertRow(client, "recipe_tag_links", ["recipe_id", "tag_id"], [
      row.recipe_id,
      row.tag_id
    ]);
  }
}

async function importShoppingLists(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM shopping_lists ORDER BY id")
    .all() as SqliteShoppingListRow[];
  logTableCount("shopping_lists", rows.length);

  for (const row of rows) {
    await insertRow(client, "shopping_lists", [
      "id",
      "name",
      "owner_id",
      "status",
      "visibility",
      "created_at",
      "updated_at"
    ], [
      row.id,
      row.name,
      row.owner_id,
      row.status ?? "active",
      row.visibility ?? "private",
      row.created_at,
      row.updated_at
    ]);
  }
}

async function importShoppingListItems(client: PoolClient, sqlite: Database.Database) {
  const rows = sqlite
    .prepare("SELECT * FROM shopping_list_items ORDER BY shopping_list_id, sort_order, id")
    .all() as SqliteShoppingListItemRow[];
  logTableCount("shopping_list_items", rows.length);

  for (const row of rows) {
    await insertRow(client, "shopping_list_items", [
      "id",
      "shopping_list_id",
      "name",
      "amount",
      "unit",
      "checked",
      "source_recipe_id",
      "note",
      "sort_order"
    ], [
      row.id,
      row.shopping_list_id,
      row.name,
      row.amount,
      row.unit,
      toBoolean(row.checked),
      row.source_recipe_id,
      row.note,
      row.sort_order
    ]);
  }
}

async function main() {
  if (!existsSync(env.SQLITE_MIGRATION_SOURCE)) {
    throw new Error(`SQLite source file not found: ${env.SQLITE_MIGRATION_SOURCE}`);
  }

  let sqlite: Database.Database | null = null;
  let client: PoolClient | null = null;

  try {
    await initializeDatabase();

    sqlite = new Database(env.SQLITE_MIGRATION_SOURCE, {
      readonly: true,
      fileMustExist: true
    });
    client = await pool.connect();

    await client.query("BEGIN");
    await ensureTargetIsEmpty(client);
    await importUsers(client, sqlite);
    await importSessions(client, sqlite);
    await importAccounts(client, sqlite);
    await importVerifications(client, sqlite);
    await importRecipes(client, sqlite);
    await importRecipeIngredients(client, sqlite);
    await importRecipeSteps(client, sqlite);
    await importTags(client, sqlite);
    await importRecipeTagLinks(client, sqlite);
    await importShoppingLists(client, sqlite);
    await importShoppingListItems(client, sqlite);
    await client.query("COMMIT");
    // eslint-disable-next-line no-console
    console.log("SQLite to PostgreSQL migration completed successfully.");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client?.release();
    sqlite?.close();
    await pool.end();
  }
}

await main();
