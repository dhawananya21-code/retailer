import { sql, ensureReady } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

// Returns the list of districts and products that actually exist in the data,
// so the dropdowns always match what's available.
export async function GET() {
  try {
    await ensureReady();
    const districts = await sql`SELECT DISTINCT district FROM videos ORDER BY district`;
    const products = await sql`SELECT DISTINCT product FROM videos ORDER BY product`;
    return Response.json({
      districts: districts.map((r) => r.district),
      products: products.map((r) => r.product),
    });
  } catch (err) {
    console.error("GET /api/options failed:", err);
    return Response.json({ error: "Could not load options." }, { status: 500 });
  }
}
