import { pool } from "./index";

export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id"         SERIAL PRIMARY KEY,
      "nickname"   TEXT NOT NULL UNIQUE,
      "emoji"      TEXT NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "availability" (
      "id"      SERIAL PRIMARY KEY,
      "date"    DATE NOT NULL,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      UNIQUE ("date", "user_id")
    );
  `);
}
