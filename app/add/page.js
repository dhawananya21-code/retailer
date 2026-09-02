"use client";

import { useEffect, useState } from "react";
import AppBar from "../AppBar";
import { MONTH_NAMES } from "../../lib/months.js";

export default function AddPage() {
  const [options, setOptions] = useState({
    regions: [],
    crops: [],
    languages: [],
    products: [],
  });
  const [form, setForm] = useState({
    youtube_url: "",
    product: "",
    crop: "",
    region: "",
    language: "",
    product_code: "",
    month: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => setOptions(d))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setNotice({ type: "ok", text: "Saved! The video has been added." });
      setForm({
        youtube_url: "", product: "", crop: "", region: "",
        language: "", product_code: "", month: "",
      });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppBar action={<a href="/" className="appbar-action">← Back</a>} />
      <main className="container form-page">
        <h2>Add a new video</h2>
        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="youtube_url">YouTube link *</label>
            <input
              id="youtube_url" type="text" value={form.youtube_url}
              onChange={set("youtube_url")}
              placeholder="https://www.youtube.com/watch?v=..." required
            />
            <p className="hint">Paste the full YouTube link or the video ID.</p>
          </div>

          <div className="field">
            <label htmlFor="product">Product *</label>
            <input
              id="product" type="text" list="products" value={form.product}
              onChange={set("product")} placeholder="e.g. Shriram Super 7711" required
            />
            <datalist id="products">
              {(options.products || []).map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="crop">Crop</label>
            <input
              id="crop" type="text" list="crops" value={form.crop}
              onChange={set("crop")} placeholder="e.g. Paddy (use commas for more than one)"
            />
            <datalist id="crops">
              {(options.crops || []).map((c) => <option key={c} value={c} />)}
            </datalist>
            <p className="hint">For several crops, separate with commas: Potato, Tomato</p>
          </div>

          <div className="field">
            <label htmlFor="region">Region</label>
            <input
              id="region" type="text" list="regions" value={form.region}
              onChange={set("region")} placeholder="e.g. Bihar (use commas for more than one)"
            />
            <datalist id="regions">
              {(options.regions || []).map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="language">Language</label>
            <input
              id="language" type="text" list="languages" value={form.language}
              onChange={set("language")} placeholder="e.g. Hindi"
            />
            <datalist id="languages">
              {(options.languages || []).map((l) => <option key={l} value={l} />)}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="product_code">Product code</label>
            <input
              id="product_code" type="text" value={form.product_code}
              onChange={set("product_code")} placeholder="Optional"
            />
          </div>

          <div className="field">
            <label htmlFor="month">Month</label>
            <div className="select-wrap">
              <select id="month" value={form.month} onChange={set("month")}>
                <option value="">Not set</option>
                {MONTH_NAMES.slice(1).map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save video"}
          </button>
        </form>
      </main>
    </>
  );
}
