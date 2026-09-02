import { sql, ensureReady } from "../../../lib/db.js";
import { extractYouTubeId } from "../../../lib/youtube.js";
import { parseCsv } from "../../../lib/csv.js";
import { parseMonth } from "../../../lib/months.js";

export const dynamic = "force-dynamic";

const isNA = (v) => {
  const t = (v || "").trim();
  return t === "" || t.toUpperCase() === "#N/A";
};
const clean = (v) => (isNA(v) ? "" : String(v).trim());
const splitMulti = (v) =>
  clean(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Maps flexible header names to our fields.
function headerIndexes(header) {
  const norm = header.map((h) => h.trim().toLowerCase());
  const find = (names) => norm.findIndex((h) => names.includes(h));
  return {
    youtube: find(["youtube link", "youtube", "youtube_url", "link", "url", "video"]),
    product: find(["product"]),
    crop: find(["crop", "crops"]),
    region: find(["region", "regions", "state"]),
    language: find(["language", "lang"]),
    product_code: find(["product code", "product_code", "code"]),
    month: find(["month"]),
  };
}

// POST /api/upload — body is raw CSV text (same columns as the source dataset).
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

    const idx = headerIndexes(rows[0]);
    if (idx.youtube < 0 || idx.product < 0) {
      return Response.json(
        {
          error:
            "Missing required columns. The header must include a YouTube link column and a Product column. Optional: Crop, Region, Language, Product Code, Month.",
        },
        { status: 400 }
      );
    }

    let added = 0;
    const skipped = [];
    const batch = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const get = (i) => (i >= 0 && cells[i] != null ? cells[i] : "");
      const youtube_url = clean(get(idx.youtube));
      const product = clean(get(idx.product));

      // Ignore fully blank rows silently; report rows that have data but no link.
      const hasData = youtube_url || product || clean(get(idx.crop)) || clean(get(idx.region));
      if (!hasData) continue;

      if (!youtube_url || !product) {
        skipped.push({ row: r + 1, reason: "missing YouTube link or Product" });
        continue;
      }
      const youtube_id = extractYouTubeId(youtube_url);
      if (!youtube_id) {
        skipped.push({ row: r + 1, reason: "invalid YouTube link" });
        continue;
      }

      batch.push({
        youtube_url,
        youtube_id,
        product,
        crop: clean(get(idx.crop)),
        crops: splitMulti(get(idx.crop)),
        region: clean(get(idx.region)),
        regions: splitMulti(get(idx.region)),
        language: clean(get(idx.language)),
        product_code: clean(get(idx.product_code)) || null,
        month: parseMonth(get(idx.month)),
        is_demo: false,
      });
      added++;
    }

    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100);
      await sql`INSERT INTO videos ${sql(
        chunk,
        "youtube_url", "youtube_id", "product", "crop", "crops",
        "region", "regions", "language", "product_code", "month", "is_demo"
      )}`;
    }

    return Response.json({ ok: true, added, skipped });
  } catch (err) {
    console.error("POST /api/upload failed:", err);
    return Response.json({ error: "Could not process the file." }, { status: 500 });
  }
}
