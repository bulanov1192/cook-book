import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const sqlite = new Database(env.DATABASE_FILE);
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("journal_mode = WAL");

export const sqliteClient = sqlite;
export const db = drizzle(sqlite, { schema });

