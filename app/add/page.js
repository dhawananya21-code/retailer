"use client";

import { useEffect, useState } from "react";
import AppBar from "../AppBar";

export default function AddPage() {
  const [districts, setDistricts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    district: "",
    product: "",
    farmer: "",
    youtube_url: "",
    title: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "ok"|"err", text }

  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => {
        setDistricts(d.districts || []);
        setProducts(d.products || []);
      })
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
      setForm({ district: "", product: "", farmer: "", youtube_url: "", title: "" });
    } catch (err) {
      setNotice({ type: "err", text: err.message });
    } finally {
      setSaving(false);
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
        <h2>Add a new video</h2>
        {notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="district">District *</label>
            <input
              id="district"
              type="text"
              list="districts"
              value={form.district}
              onChange={set("district")}
              placeholder="e.g. Nashik"
              required
            />
            <datalist id="districts">
              {districts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="product">Product *</label>
            <input
              id="product"
              type="text"
              list="products"
              value={form.product}
              onChange={set("product")}
              placeholder="e.g. Onion"
              required
            />
            <datalist id="products">
              {products.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="farmer">Farmer or Village name</label>
            <input
              id="farmer"
              type="text"
              value={form.farmer}
              onChange={set("farmer")}
              placeholder="Optional"
            />
          </div>

          <div className="field">
            <label htmlFor="youtube_url">YouTube link *</label>
            <input
              id="youtube_url"
              type="text"
              value={form.youtube_url}
              onChange={set("youtube_url")}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="hint">Paste the full YouTube link or the video ID.</p>
          </div>

          <div className="field">
            <label htmlFor="title">Short title / description *</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Onion farmer shares his results"
              required
            />
          </div>

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save video"}
          </button>
        </form>
      </main>
    </>
  );
}
