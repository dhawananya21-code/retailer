import { sql, ensureReady } from "../../../lib/db.js";
import { extractYouTubeId } from "../../../lib/youtube.js";
import { parseCsv } from "../../../lib/csv.js";

export const dynamic = "force-dynamic";

// Maps flexible header names to our fields, so the CSV isn't fussy about
// exact spelling ("youtube", "youtube_url", "link", "video" all work).
function pickHeaderIndexes(header) {
  const norm = header.map((h) => h.trim().toLowerCase());
  const find = (names) => norm.findIndex((h) => names.includes(h));
  return {
    district: find(["district"]),
    product: find(["product", "crop"]),
    farmer: find(["farmer", "village", "farmer or village", "farmer/village", "name"]),
    youtube: find(["youtube", "youtube_url", "youtube link", "link", "url", "video"]),
    title: find(["title", "description", "short title"]),
  };
}

// POST /api/upload  — body is raw CSV text. First row must be the header.
export async function POST(request) {
  try {
    await ensureReady();
    const text = await request.text();
    if (!text || !text.trim()) {
      return Response.json({ error: "The uploaded file was empty." }, { status: 400 });
    }

    const rows = parseCsv(text);
    if (rows.length < 2) {
      return Response.json(
        { error: "The file needs a header row plus at least one data row." },
        { status: 400 }
      );
    }

    const idx = pickHeaderIndexes(rows[0]);
    if (idx.district < 0 || idx.product < 0 || idx.youtube < 0 || idx.title < 0) {
      return Response.json(
        {
          error:
            "Missing required columns. The header must include: district, product, youtube (link), title. An optional farmer/village column is also supported.",
        },
        { status: 400 }
      );
    }

    let added = 0;
    const skipped = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const get = (i) => (i >= 0 && cells[i] != null ? cells[i].trim() : "");
      const district = get(idx.district);
      const product = get(idx.product);
      const farmer = get(idx.farmer);
      const youtube_url = get(idx.youtube);
      const title = get(idx.title);

      if (!district || !product || !youtube_url || !title) {
        skipped.push({ row: r + 1, reason: "missing a required value" });
        continue;
      }
      const youtube_id = extractYouTubeId(youtube_url);
      if (!youtube_id) {
        skipped.push({ row: r + 1, reason: "invalid YouTube link" });
        continue;
      }

      await sql`
        INSERT INTO videos (district, product, farmer, youtube_url, youtube_id, title, is_demo)
        VALUES (${district}, ${product}, ${farmer}, ${youtube_url}, ${youtube_id}, ${title}, FALSE)
      `;
      added++;
    }

    return Response.json({ ok: true, added, skipped });
  } catch (err) {
    console.error("POST /api/upload failed:", err);
    return Response.json({ error: "Could not process the file." }, { status: 500 });
  }
}
