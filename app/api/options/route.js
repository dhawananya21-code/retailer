import { sql, ensureReady } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

// All dropdown options are generated from the DISTINCT values actually present
// in the data, so they stay accurate as videos are added or removed.
// crops/regions are stored as arrays (some videos list several), so we UNNEST
// them to list every individual crop/region that appears anywhere.
export async function GET() {
  try {
    await ensureReady();
    const [crops, regions, languages, products, months] = await Promise.all([
      sql`SELECT DISTINCT unnest(crops) AS v FROM videos ORDER BY v`,
      sql`SELECT DISTINCT unnest(regions) AS v FROM videos ORDER BY v`,
      sql`SELECT DISTINCT language AS v FROM videos WHERE language <> '' ORDER BY v`,
      sql`SELECT DISTINCT product AS v FROM videos WHERE product <> '' ORDER BY v`,
      sql`SELECT DISTINCT month AS v FROM videos WHERE month IS NOT NULL ORDER BY v`,
    ]);
    return Response.json({
      crops: crops.map((r) => r.v),
      regions: regions.map((r) => r.v),
      languages: languages.map((r) => r.v),
      products: products.map((r) => r.v),
      months: months.map((r) => r.v),
    });
  } catch (err) {
    console.error("GET /api/options failed:", err);
    return Response.json({ error: "Could not load options." }, { status: 500 });
  }
}
