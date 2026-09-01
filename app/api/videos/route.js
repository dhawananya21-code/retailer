import { sql, ensureReady } from "../../../lib/db.js";
import { extractYouTubeId } from "../../../lib/youtube.js";

export const dynamic = "force-dynamic";

// GET /api/videos?district=Nashik&product=Onion
// Any filter left blank ("" or "All") is ignored, so it acts as "show all".
export async function GET(request) {
  try {
    await ensureReady();
    const { searchParams } = new URL(request.url);
    const district = (searchParams.get("district") || "").trim();
    const product = (searchParams.get("product") || "").trim();

    const rows = await sql`
      SELECT id, district, product, farmer, youtube_url, youtube_id, title, is_demo
      FROM videos
      WHERE (${district} = '' OR district = ${district})
        AND (${product} = '' OR product = ${product})
      ORDER BY created_at DESC, id DESC
    `;
    return Response.json({ videos: rows });
  } catch (err) {
    console.error("GET /api/videos failed:", err);
    return Response.json({ error: "Could not load videos." }, { status: 500 });
  }
}

// POST /api/videos  — add one new entry (from the Add New Entry form).
export async function POST(request) {
  try {
    await ensureReady();
    const body = await request.json();
    const district = (body.district || "").trim();
    const product = (body.product || "").trim();
    const farmer = (body.farmer || "").trim();
    const youtube_url = (body.youtube_url || "").trim();
    const title = (body.title || "").trim();

    if (!district || !product || !youtube_url || !title) {
      return Response.json(
        { error: "District, Product, YouTube link and Title are all required." },
        { status: 400 }
      );
    }

    const youtube_id = extractYouTubeId(youtube_url);
    if (!youtube_id) {
      return Response.json(
        { error: "That doesn't look like a valid YouTube link." },
        { status: 400 }
      );
    }

    const [row] = await sql`
      INSERT INTO videos (district, product, farmer, youtube_url, youtube_id, title, is_demo)
      VALUES (${district}, ${product}, ${farmer}, ${youtube_url}, ${youtube_id}, ${title}, FALSE)
      RETURNING id
    `;
    return Response.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("POST /api/videos failed:", err);
    return Response.json({ error: "Could not save the entry." }, { status: 500 });
  }
}
