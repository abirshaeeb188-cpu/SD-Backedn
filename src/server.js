import app from "./app.js";
import env from "./config/env.js";
import pool from "./config/db.js";

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✔ Connected to PostgreSQL");
  } catch (err) {
    console.error("✘ Could not connect to PostgreSQL:", err.message);
    console.error("  Check your .env PG* values and that PostgreSQL is running.");
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`✔ API server running at http://localhost:${env.port}`);
    console.log(`  CORS allowed origin: ${env.clientUrl}`);
  });
}

start();
