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
        "Remove the example video? Your own added videos will be kept."
      )
    )
      return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/videos/clear-demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove example.");
      setNotice({
        type: "ok",
        text:
          data.deleted > 0
            ? "Example video removed."
            : "No example video to remove.",
      });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AppBar action={<a href="/" className="appbar-action">← Back</a>} />
      <main className="container form-page">
        <h2>Manage entries</h2>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <div className="field">
          <Link href="/add" className="btn">
            Add a new video
          </Link>
        </div>
        <div className="field">
          <Link href="/upload" className="btn secondary">
            Upload videos from CSV
          </Link>
        </div>

        <p className="section-label">Example video</p>
        <p className="hint">
          The app includes one example video (official Shriram content) to show
          that playback and filtering work. Once you&apos;ve added your real
          farmer testimonials, you can remove it here.
        </p>
        <div className="field">
          <button className="btn secondary" onClick={clearDemo} disabled={busy}>
            {busy ? "Removing…" : "Remove example video"}
          </button>
        </div>
      </main>
    </>
  );
}
