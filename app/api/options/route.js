import { districts, products } from "../../../lib/filterOptions.js";

export const dynamic = "force-dynamic";

// The District and Product dropdown lists come from the retailer's own
// canonical list (lib/Districts_Regions_Products.csv, baked into
// lib/filterOptions.js) — NOT from whatever videos happen to be in the
// database. This keeps the filters showing only real districts and products.
export async function GET() {
  return Response.json({ districts, products });
}
