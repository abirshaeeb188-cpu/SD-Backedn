import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seed() {
  const sql = readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
  console.log("Seeding demo data...");
  await pool.query(sql);
  console.log("✔ Seed complete. Demo login: khalid@example.com / password123");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
