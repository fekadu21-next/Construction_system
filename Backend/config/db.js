import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
});

// Report unexpected connection errors.
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

// Test the database connection.
export async function connectDB() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        NOW() AS server_time
    `);

    console.log("Supabase PostgreSQL connected successfully!");
    console.log("Database:", result.rows[0].database_name);
    console.log("Database time:", result.rows[0].server_time);

    return result.rows[0];
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  } finally {
    client?.release();
  }
}

// Export the pool for use in API routes.
export default pool;
