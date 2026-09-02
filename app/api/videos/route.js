import { sql, ensureReady } from "../../../lib/db.js";
import { extractYouTubeId } from "../../../lib/youtube.js";
import { parseMonth } from "../../../lib/months.js";

export const dynamic = "force-dynamic";

// Split a comma-separated cell ("Potato, Tomato") into a clean list.
function splitMulti(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// GET /api/videos?crop=&region=&language=&product=&month=
// Any filter left blank is ignored. For crop and region (which can hold several
// comma-separated values per video) a match means the selected value appears
// anywhere in that video's list — done with "= ANY(array)".
export async function GET(request) {
  try {
    await ensureReady();
    const { searchParams } = new URL(request.url);
    const crop = (searchParams.get("crop") || "").trim();
    const region = (searchParams.get("region") || "").trim();
    const language = (searchParams.get("language") || "").trim();
    const product = (searchParams.get("product") || "").trim();
    const monthRaw = (searchParams.get("month") || "").trim();
    const month = monthRaw ? parseMonth(monthRaw) : null;

    // Videos tagged with these generic values are relevant to every crop /
    // region, so they always match a specific crop/region selection too.
    const ALL_CROPS = "All Crops";
    const ALL_INDIA = "All India";

    const rows = await sql`
      SELECT id, youtube_url, youtube_id, product, crop, crops, region, regions,
             language, product_code, month, is_demo
      FROM videos
      WHERE (${crop} = '' OR ${crop} = ANY(crops) OR ${ALL_CROPS} = ANY(crops))
        AND (${region} = '' OR ${region} = ANY(regions) OR ${ALL_INDIA} = ANY(regions))
        AND (${language} = '' OR language = ${language})
        AND (${product} = '' OR product = ${product})
        AND (${month === null} OR month = ${month})
      ORDER BY created_at DESC, id DESC
    `;
    return Response.json({ videos: rows });
  } catch (err) {
    console.error("GET /api/videos failed:", err);
    return Response.json({ error: "Could not load videos." }, { status: 500 });
  }
}

// POST /api/videos — add one new entry from the Add New Entry form.
export async function POST(request) {
  try {
    await ensureReady();
    const body = await request.json();
    const youtube_url = (body.youtube_url || "").trim();
    const product = (body.product || "").trim();
    const crop = (body.crop || "").trim();
    const region = (body.region || "").trim();
    const language = (body.language || "").trim();
    const product_code = (body.product_code || "").trim() || null;
    const month = parseMonth(body.month);

    if (!youtube_url || !product) {
      return Response.json(
        { error: "YouTube link and Product are required." },
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

    const crops = splitMulti(crop);
    const regions = splitMulti(region);

    const [row] = await sql`
      INSERT INTO videos
        (youtube_url, youtube_id, product, crop, crops, region, regions, language, product_code, month, is_demo)
      VALUES
        (${youtube_url}, ${youtube_id}, ${product}, ${crop}, ${crops}, ${region}, ${regions}, ${language}, ${product_code}, ${month}, FALSE)
      RETURNING id
    `;
    return Response.json({ ok: true, id: row.id });
  } catch (err) {
    console.error("POST /api/videos failed:", err);
    return Response.json({ error: "Could not save the entry." }, { status: 500 });
  }
}
