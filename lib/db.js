import postgres from "postgres";
import { demoVideos } from "./demoData.js";
import { extractYouTubeId } from "./youtube.js";

// IMPORTANT: We must NOT open a database connection (or throw) when this file
// is first loaded, because Vercel loads it during the build — before a
// database is connected. Instead we connect lazily, the first time a query
// actually runs (which only happens when a real request comes in). By then
// the database is connected and the connection string is available.

const globalForDb = globalThis;

// Finds the Postgres connection string in the environment. We check the
// common standard names first, then fall back to scanning for ANY variable
// whose value looks like a Postgres URL. This makes the app work no matter
// what Vercel/Neon names the variable (e.g. a custom "STORAGE_" prefix).
function findConnectionString() {
  const preferred = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
  ];
  for (const key of preferred) {
    if (process.env[key]) return process.env[key];
  }

  const candidates = Object.values(process.env).filter(
    (v) => typeof v === "string" && /^postgres(ql)?:\/\//.test(v)
  );
  if (candidates.length) {
    // Prefer a pooled connection (better for serverless) when available.
    return candidates.find((v) => v.includes("-pooler")) || candidates[0];
  }
  return null;
}

function getClient() {
  if (globalForDb.__sql) return globalForDb.__sql;

  // Locally this comes from .env.local; on Vercel, connecting a Postgres
  // database sets this automatically.
  const connectionString = findConnectionString();

  if (!connectionString) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or POSTGRES_URL)."
    );
  }

  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  globalForDb.__sql = postgres(connectionString, {
    ssl: isLocal ? false : "require",
  });
  return globalForDb.__sql;
}

// `sql` behaves exactly like a postgres.js client (used as a tagged template,
// e.g. sql`SELECT 1`), but the real client isn't created until first use.
export const sql = new Proxy(function () {}, {
  apply(_target, _thisArg, args) {
    return getClient()(...args);
  },
  get(_target, prop) {
    return getClient()[prop];
  },
});

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
