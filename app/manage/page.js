"use client";

import { useState } from "react";
import Link from "next/link";
import AppBar from "../AppBar";

export default function ManagePage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function clearDemo() {
    if (
      !confirm(
        "Remove all placeholder DEMO videos? Your real entries will be kept."
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/videos/clear-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not clear demo data.");
      setNotice({
        type: "ok",
        text: `Removed ${data.deleted} demo video(s).`,
      });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppBar
        action={
          <a href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>
            ← Back
          </a>
        }
      />
      <main className="container form-page">
        <h2>Manage entries</h2>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <div className="field">
          <Link href="/add" className="btn">
            ➕ Add a new video
          </Link>
        </div>
        <div className="field">
          <Link href="/upload" className="btn secondary">
            📄 Upload videos from CSV
          </Link>
        </div>

        <h3 style={{ marginTop: 28 }}>Demo data</h3>
        <p className="hint">
          The app comes preloaded with placeholder demo videos so you can test
          it. Once you&apos;ve added your real farmer testimonials, remove the
          demo ones here.
        </p>
        <div className="field">
          <button className="btn secondary" onClick={clearDemo} disabled={busy}>
            {busy ? "Removing…" : "🗑️ Remove all demo videos"}
          </button>
        </div>
      </main>
    </>
  );
}
