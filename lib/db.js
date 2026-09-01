import postgres from "postgres";
import { demoVideos } from "./demoData.js";
import { extractYouTubeId } from "./youtube.js";

// Read the database connection string from the environment.
// - Locally, this comes from .env.local
// - On Vercel, connecting a Postgres database sets these automatically.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set DATABASE_URL (or POSTGRES_URL)."
  );
}

// One shared connection for the whole app.
// `globalThis` caching prevents opening a new pool on every hot-reload in dev.
const globalForDb = globalThis;
export const sql =
  globalForDb.__sql ||
  postgres(connectionString, {
    // Neon / Vercel Postgres require SSL; a local database does not.
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : "require",
  });
if (!globalForDb.__sql) globalForDb.__sql = sql;

// Make sure the table exists, and load the demo videos the first time the
// table is empty. We only run this once per server start.
let readyPromise = null;
export function ensureReady() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init() {
  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id          SERIAL PRIMARY KEY,
      district    TEXT NOT NULL,
      product     TEXT NOT NULL,
      farmer      TEXT NOT NULL DEFAULT '',
      youtube_url TEXT NOT NULL,
      youtube_id  TEXT NOT NULL,
      title       TEXT NOT NULL,
      is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM videos`;
  if (count === 0) {
    for (const v of demoVideos) {
      const id = extractYouTubeId(v.youtube);
      if (!id) continue;
      await sql`
        INSERT INTO videos (district, product, farmer, youtube_url, youtube_id, title, is_demo)
        VALUES (${v.district}, ${v.product}, ${v.farmer}, ${v.youtube}, ${id}, ${v.title}, TRUE)
      `;
    }
  }
}
