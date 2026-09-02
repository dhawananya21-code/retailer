import postgres from "postgres";
import { seedVideos } from "./videoSeed.js";

// IMPORTANT: We must NOT open a database connection (or throw) when this file
// is first loaded, because Vercel loads it during the build — before a
// database is connected. Instead we connect lazily, the first time a query
// actually runs. By then the database is connected and the connection string
// is available.

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
    return candidates.find((v) => v.includes("-pooler")) || candidates[0];
  }
  return null;
}

function getClient() {
  if (globalForDb.__sql) return globalForDb.__sql;
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

// `sql` behaves like a postgres.js client but connects lazily on first use.
export const sql = new Proxy(function () {}, {
  apply(_t, _this, args) {
    return getClient()(...args);
  },
  get(_t, prop) {
    return getClient()[prop];
  },
});

let readyPromise = null;
export function ensureReady() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

async function init() {
  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id           SERIAL PRIMARY KEY,
      youtube_url  TEXT NOT NULL,
      youtube_id   TEXT NOT NULL,
      product      TEXT NOT NULL DEFAULT '',
      crop         TEXT NOT NULL DEFAULT '',
      crops        TEXT[] NOT NULL DEFAULT '{}',
      region       TEXT NOT NULL DEFAULT '',
      regions      TEXT[] NOT NULL DEFAULT '{}',
      language     TEXT NOT NULL DEFAULT '',
      product_code TEXT,
      month        INTEGER,
      is_demo      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `;

  // One-time migration to the real dataset (Region/Crop/Language/Product/Month).
  // Older versions used a District/Product schema; rebuild the table cleanly.
  const [done] = await sql`SELECT 1 FROM app_meta WHERE key = 'seed_v3'`;
  if (!done) {
    await sql`DROP TABLE IF EXISTS videos`;
    await sql`
      CREATE TABLE videos (
        id           SERIAL PRIMARY KEY,
        youtube_url  TEXT NOT NULL,
        youtube_id   TEXT NOT NULL,
        product      TEXT NOT NULL DEFAULT '',
        crop         TEXT NOT NULL DEFAULT '',
        crops        TEXT[] NOT NULL DEFAULT '{}',
        region       TEXT NOT NULL DEFAULT '',
        regions      TEXT[] NOT NULL DEFAULT '{}',
        language     TEXT NOT NULL DEFAULT '',
        product_code TEXT,
        month        INTEGER,
        is_demo      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Bulk-insert the seed data in chunks.
    const chunkSize = 100;
    for (let i = 0; i < seedVideos.length; i += chunkSize) {
      const chunk = seedVideos.slice(i, i + chunkSize).map((v) => ({
        youtube_url: v.youtube_url,
        youtube_id: v.youtube_id,
        product: v.product || "",
        crop: v.crop || "",
        crops: v.crops || [],
        region: v.region || "",
        regions: v.regions || [],
        language: v.language || "",
        product_code: v.product_code ?? null,
        month: v.month ?? null,
        is_demo: false,
      }));
      await sql`INSERT INTO videos ${sql(
        chunk,
        "youtube_url",
        "youtube_id",
        "product",
        "crop",
        "crops",
        "region",
        "regions",
        "language",
        "product_code",
        "month",
        "is_demo"
      )}`;
    }

    await sql`INSERT INTO app_meta (key, value) VALUES ('seed_v3', NOW()::text)`;
  }
}
