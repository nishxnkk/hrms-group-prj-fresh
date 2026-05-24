import pkg from "pg"; // pg package
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Reuse pool across Lambda invocations to avoid exhausting DB connections
const pool = global.__pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
if (!global.__pgPool) global.__pgPool = pool;

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.connect()
  .then((client) => {
    console.log("✅ Neon PostgreSQL Connected");
    client.release();
  })
  .catch((err) => console.error("❌ Neon Connection Failed:", err));

export default pool;