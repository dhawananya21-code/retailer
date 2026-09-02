"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AppBar from "./AppBar";
import { thumbnailUrl, embedUrl, watchUrl } from "../lib/youtube.js";
import { monthName } from "../lib/months.js";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

// The five filter dimensions, in display order.
const FILTERS = [
  { key: "region", label: "Region" },
  { key: "crop", label: "Crop" },
  { key: "language", label: "Language" },
  { key: "product", label: "Product" },
  { key: "month", label: "Month" },
];

export default function HomePage() {
  const [options, setOptions] = useState({
    regions: [],
    crops: [],
    languages: [],
    products: [],
    months: [],
  });
  const [filters, setFilters] = useState({
    region: "",
    crop: "",
    language: "",
    product: "",
    month: "",
  });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const hasFilter = Object.values(filters).some(Boolean);

  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => setOptions({
        regions: d.regions || [],
        crops: d.crops || [],
        languages: d.languages || [],
        products: d.products || [],
        months: d.months || [],
      }))
      .catch(() => {});
  }, []);

  const loadVideos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    fetch(`/api/videos?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setVideos(d.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function clearFilters() {
    setFilters({ region: "", crop: "", language: "", product: "", month: "" });
  }

  function optionsFor(key) {
    if (key === "month") return options.months;
    return options[`${key}s`] || [];
  }

  return (
    <>
      <AppBar />
      <main className="container">
        <section className="filters" aria-label="Filter videos">
          {FILTERS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <div className="select-wrap">
                <select
                  id={key}
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                >
                  <option value="">All {label.toLowerCase()}s</option>
                  {optionsFor(key).map((opt) => (
                    <option key={opt} value={opt}>
                      {key === "month" ? monthName(opt) : opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </section>

        <div className="results-head">
          <span className="result-count">
            {loading
              ? "Loading…"
              : `${videos.length} video${videos.length === 1 ? "" : "s"}`}
          </span>
          {hasFilter && (
            <button className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? null : videos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden="true">🎬</div>
            <p className="empty-title">No videos match these filters</p>
            <p className="empty-sub">
              Try clearing a filter, or add videos with Add New Entry or Upload CSV.
            </p>
            <div className="empty-actions">
              <Link href="/add" className="btn">Add New Entry</Link>
              <Link href="/upload" className="btn secondary">Upload CSV</Link>
            </div>
          </div>
        ) : (
          <div className="cards">
            {videos.map((v) => (
              <button
                key={v.id}
                className="card"
                onClick={() => setActive(v)}
                aria-label={`Play ${v.product || "video"}`}
              >
                <div className="thumb">
                  <img src={thumbnailUrl(v.youtube_id)} alt="" loading="lazy" />
                  <span className="play" aria-hidden="true"><PlayIcon /></span>
                </div>
                <div className="card-body">
                  <p className="card-title">{v.product || "Untitled video"}</p>
                  <div className="chips">
                    {v.crop && <span className="chip">{v.crop}</span>}
                    {v.region && <span className="chip alt">{v.region}</span>}
                    {v.language && <span className="chip muted">{v.language}</span>}
                  </div>
                  {monthName(v.month) && (
                    <p className="card-note">Month: {monthName(v.month)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <iframe
              className="player"
              src={`${embedUrl(active.youtube_id)}?autoplay=1&rel=0`}
              title={active.product || "Video"}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="modal-body">
              <h3>{active.product || "Video"}</h3>
              {(active.crop || active.region || active.language) && (
                <div className="chips" style={{ marginBottom: 14 }}>
                  {active.crop && <span className="chip">{active.crop}</span>}
                  {active.region && <span className="chip alt">{active.region}</span>}
                  {active.language && <span className="chip muted">{active.language}</span>}
                </div>
              )}
              <div className="modal-actions">
                <a
                  className="btn secondary"
                  href={watchUrl(active.youtube_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in YouTube
                </a>
                <button className="btn" onClick={() => setActive(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
