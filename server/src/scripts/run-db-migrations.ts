import { initializeDatabase } from "../db/init.js";
import { pool } from "../db/client.js";

try {
  await initializeDatabase();
  // eslint-disable-next-line no-console
  console.log("Database migrations completed.");
} finally {
  await pool.end();
}
