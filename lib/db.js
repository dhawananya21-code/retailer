import postgres from "postgres";
import { extractYouTubeId } from "./youtube.js";

// IMPORTANT: We must NOT open a database connection (or throw) when this file
// is first loaded, because Vercel loads it during the build — before a
// database is connected. Instead we connect lazily, the first time a query
// actually runs (which only happens when a real request comes in). By then
// the database is connected and the connection string is available.

const globalForDb = globalThis;

// The single clearly-labelled example video. It is genuine public Shriram
// content, included ONLY to demonstrate that playback and filtering work with
// a real link. It is deliberately NOT tied to a district/product and carries
// no farmer name, so nobody mistakes it for a real testimonial from our own
// retailer network.
const EXAMPLE_VIDEO = {
  youtube_url: "https://youtu.be/UWChWNTARbs",
  title: "Example video – official Shriram content",
};

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

// Runs once per server start: create tables and apply any one-time data
// migrations. Memoised so it only happens on the first request.
let readyPromise = null;
export function ensureReady() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init() {
  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id          SERIAL PRIMARY KEY,
      district    TEXT NOT NULL DEFAULT '',
      product     TEXT NOT NULL DEFAULT '',
      farmer      TEXT NOT NULL DEFAULT '',
      youtube_url TEXT NOT NULL,
      youtube_id  TEXT NOT NULL,
      title       TEXT NOT NULL,
      is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // A tiny table to record one-time migrations, so we don't repeat them.
  await sql`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `;

  const [done] = await sql`SELECT 1 FROM app_meta WHERE key = 'seed_v2'`;
  if (!done) {
    // Remove ALL old placeholder/demo videos (the 12 unrelated music/comedy
    // clips seeded earlier), then add the single clearly-labelled example.
    await sql`DELETE FROM videos WHERE is_demo = TRUE`;

    const id = extractYouTubeId(EXAMPLE_VIDEO.youtube_url);
    await sql`
      INSERT INTO videos (district, product, farmer, youtube_url, youtube_id, title, is_demo)
      VALUES ('', '', '', ${EXAMPLE_VIDEO.youtube_url}, ${id}, ${EXAMPLE_VIDEO.title}, TRUE)
    `;

    await sql`INSERT INTO app_meta (key, value) VALUES ('seed_v2', NOW()::text)`;
  }
}
