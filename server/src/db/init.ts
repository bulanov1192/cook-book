import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./client.js";

const migrationsDirectory = path.resolve(process.cwd(), "migrations");

export async function initializeDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const entries = await readdir(migrationsDirectory, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  for (const filename of migrationFiles) {
    const existing = await pool.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations WHERE filename = $1 LIMIT 1",
      [filename]
    );

    if (existing.rowCount) {
      continue;
    }

    const migrationSql = await readFile(path.join(migrationsDirectory, filename), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(migrationSql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
