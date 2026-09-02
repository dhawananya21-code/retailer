"use client";

import Link from "next/link";
import AppBar from "../AppBar";

export default function ManagePage() {
  return (
    <>
      <AppBar action={<a href="/" className="appbar-action">← Back</a>} />
      <main className="container form-page">
        <h2>Manage entries</h2>
        <p className="hint">
          Add more testimonial videos to the platform. New entries appear in the
          filters straight away.
        </p>

        <div className="field" style={{ marginTop: 16 }}>
          <Link href="/add" className="btn">Add a new video</Link>
        </div>
        <div className="field">
          <Link href="/upload" className="btn secondary">Upload videos from CSV</Link>
        </div>
      </main>
    </>
  );
}
