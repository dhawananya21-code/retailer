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
          .slice(0, 8)
          .map((s) => `row ${s.row} (${s.reason})`)
          .join(", ")}${data.skipped.length > 8 ? "…" : ""}.`;
      }
      setNotice({ type: "ok", text: msg });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  const sample =
    "Youtube link,Product,Crop,Region,Language,Product Code,Month\n" +
    "https://www.youtube.com/watch?v=E8wmNJGXZNc,Shriram Super 7711,Paddy,Bihar,Hindi,7711006RP,9\n" +
    'https://youtu.be/uJJ32v2r8XU,Shriram 412,"Potato, Tomato","Andhra Pradesh, Telangana",Kannada,412X028HY,9';

  return (
    <>
      <AppBar action={<a href="/" className="appbar-action">← Back</a>} />
      <main className="container form-page">
        <h2>Upload videos from a CSV file</h2>
        <p className="hint">
          Add many videos at once, using the same columns as the source dataset:
          <strong> Youtube link, Product, Crop, Region, Language, Product Code, Month</strong>.
          Only <strong>Youtube link</strong> and <strong>Product</strong> are required.
        </p>
        <p className="hint">
          Crop and Region may list several comma-separated values (put them in
          quotes, e.g. <code>&quot;Potato, Tomato&quot;</code>). Blank cells or
          <code> #N/A</code> are treated as empty.
        </p>

        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <div className="field" style={{ marginTop: 16 }}>
          <label className="btn" htmlFor="csv" style={{ display: "block" }}>
            {busy ? "Uploading…" : "📄 Choose CSV file"}
          </label>
          <input
            id="csv" type="file" accept=".csv,text/csv"
            onChange={onFile} disabled={busy} style={{ display: "none" }}
          />
          {fileName && <p className="hint">Selected: {fileName}</p>}
        </div>

        <p className="section-label">Example file format</p>
        <pre
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 14,
            overflowX: "auto",
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          {sample}
        </pre>
      </main>
    </>
  );
}
