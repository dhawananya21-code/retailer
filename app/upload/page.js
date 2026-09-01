"use client";

import { useState } from "react";
import AppBar from "../AppBar";

export default function UploadPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [fileName, setFileName] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    setNotice(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      let msg = `Added ${data.added} video${data.added === 1 ? "" : "s"}.`;
      if (data.skipped?.length) {
        msg += ` Skipped ${data.skipped.length} row(s): ${data.skipped
          .map((s) => `row ${s.row} (${s.reason})`)
          .join(", ")}.`;
      }
      setNotice({ type: "ok", text: msg });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setBusy(false);
      e.target.value = ""; // allow re-uploading the same file
    }
  }

  const sample =
    "district,product,farmer,youtube,title\n" +
    "Nashik,Onion,Ramesh Patil,https://www.youtube.com/watch?v=jNQXAC9IVRw,Onion farmer testimonial\n" +
    "Pune,Wheat,,https://youtu.be/hT_nvWreIhg,Wheat harvest story";

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
        <h2>Upload videos from a CSV file</h2>
        <p className="hint">
          Add many videos at once. Your file needs a header row with these
          columns: <strong>district, product, youtube, title</strong> (and an
          optional <strong>farmer</strong> column).
        </p>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <div className="field" style={{ marginTop: 16 }}>
          <label className="btn" htmlFor="csv" style={{ display: "block" }}>
            {busy ? "Uploading…" : "📄 Choose CSV file"}
          </label>
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={busy}
            style={{ display: "none" }}
          />
          {fileName && <p className="hint">Selected: {fileName}</p>}
        </div>

        <h3 style={{ marginTop: 28 }}>Example file format</h3>
        <pre
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 14,
            overflowX: "auto",
            fontSize: 13,
          }}
        >
          {sample}
        </pre>
      </main>
    </>
  );
}
