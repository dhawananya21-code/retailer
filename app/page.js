"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AppBar from "./AppBar";
import { thumbnailUrl, embedUrl, watchUrl } from "../lib/youtube.js";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

export default function HomePage() {
  const [districts, setDistricts] = useState([]);
  const [products, setProducts] = useState([]);
  const [district, setDistrict] = useState("");
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // the video open in the player

  const hasFilter = Boolean(district || product);

  // Load the dropdown options once (from the retailer's real district/product lists).
  useEffect(() => {
    fetch("/api/options")
      .then((r) => r.json())
      .then((d) => {
        setDistricts(d.districts || []);
        setProducts(d.products || []);
      })
      .catch(() => {});
  }, []);

  // Load (or reload) the videos whenever a filter changes.
  const loadVideos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (product) params.set("product", product);
    fetch(`/api/videos?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setVideos(d.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [district, product]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  function clearFilters() {
    setDistrict("");
    setProduct("");
  }

  return (
    <>
      <AppBar />
      <main className="container">
        <section className="filters" aria-label="Filter videos">
          <div className="field">
            <label htmlFor="district">District</label>
            <div className="select-wrap">
              <select
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">All districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="product">Product</label>
            <div className="select-wrap">
              <select
                id="product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">All products</option>
                {products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
            <p className="empty-title">No more videos added yet</p>
            <p className="empty-sub">
              Use Add New Entry or Upload CSV to add farmer testimonial videos.
            </p>
            <div className="empty-actions">
              <Link href="/add" className="btn">
                Add New Entry
              </Link>
              <Link href="/upload" className="btn secondary">
                Upload CSV
              </Link>
            </div>
          </div>
        ) : (
          <div className="cards">
            {videos.map((v) => (
              <button
                key={v.id}
                className="card"
                onClick={() => setActive(v)}
                aria-label={`Play ${v.title}`}
              >
                <div className="thumb">
                  <img src={thumbnailUrl(v.youtube_id)} alt="" loading="lazy" />
                  <span className="play" aria-hidden="true">
                    <PlayIcon />
                  </span>
                </div>
                <div className="card-body">
                  {v.is_demo && <span className="badge-example">Example</span>}
                  <p className="card-title">{v.title}</p>
                  {(v.district || v.product) && (
                    <div className="chips">
                      {v.district && <span className="chip">{v.district}</span>}
                      {v.product && <span className="chip">{v.product}</span>}
                    </div>
                  )}
                  {v.is_demo && (
                    <p className="card-note">
                      Official Shriram content, shown to demonstrate playback.
                      Not a testimonial from our own retailer network.
                    </p>
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
              title={active.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="modal-body">
              <h3>{active.title}</h3>
              <div className="modal-actions">
                <a
                  className="btn secondary"
                  href={watchUrl(active.youtube_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in YouTube
                </a>
                <button className="btn" onClick={() => setActive(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
