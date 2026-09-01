"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AppBar from "./AppBar";
import { thumbnailUrl, embedUrl, watchUrl } from "../lib/youtube.js";

export default function HomePage() {
  const [districts, setDistricts] = useState([]);
  const [products, setProducts] = useState([]);
  const [district, setDistrict] = useState("");
  const [product, setProduct] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // the video open in the player
  const [hasDemo, setHasDemo] = useState(false);

  // Load the dropdown options once.
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
      .then((d) => {
        const list = d.videos || [];
        setVideos(list);
        setHasDemo(list.some((v) => v.is_demo));
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [district, product]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return (
    <>
      <AppBar />
      <main className="container">
        {hasDemo && (
          <div className="demo-banner">
            ⚠️ Showing placeholder DEMO videos for testing. These are not real
            farmer testimonials. Replace them on the Manage page.
          </div>
        )}

        <div className="filters">
          <div className="field">
            <label htmlFor="district">District</label>
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
          <div className="field">
            <label htmlFor="product">Product</label>
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

        <p className="result-count">
          {loading
            ? "Loading…"
            : `${videos.length} video${videos.length === 1 ? "" : "s"} found`}
        </p>

        {!loading && videos.length === 0 ? (
          <div className="empty">
            <p>No videos match this filter yet.</p>
            <p>
              <Link href="/add" className="btn secondary">
                ➕ Add a video
              </Link>
            </p>
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
                  <img
                    src={thumbnailUrl(v.youtube_id)}
                    alt=""
                    loading="lazy"
                  />
                  <div className="play-badge">
                    <span>▶</span>
                  </div>
                </div>
                <div className="card-body">
                  <p className="card-title">{v.title}</p>
                  <div className="chips">
                    <span className="chip">{v.district}</span>
                    <span className="chip">{v.product}</span>
                    {v.is_demo && <span className="chip demo">DEMO</span>}
                  </div>
                  {v.farmer ? (
                    <p className="card-farmer">👤 {v.farmer}</p>
                  ) : null}
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
