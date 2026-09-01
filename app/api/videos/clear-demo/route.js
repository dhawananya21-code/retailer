import { sql, ensureReady } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

// POST /api/videos/clear-demo  — removes only the placeholder demo entries,
// leaving any real entries untouched.
export async function POST() {
  try {
    await ensureReady();
    const deleted = await sql`DELETE FROM videos WHERE is_demo = TRUE RETURNING id`;
    return Response.json({ ok: true, deleted: deleted.length });
  } catch (err) {
    console.error("POST /api/videos/clear-demo failed:", err);
    return Response.json({ error: "Could not clear demo entries." }, { status: 500 });
  }
}
