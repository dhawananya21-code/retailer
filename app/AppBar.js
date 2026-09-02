import Link from "next/link";

export default function AppBar({ action }) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">🌱</span>
          <div className="brand-text">
            <span className="brand-title">Farmer Video Finder</span>
            <span className="brand-tagline">Testimonials by crop, region &amp; language</span>
          </div>
        </div>
        {action || (
          <Link href="/manage" className="appbar-action">
            Manage
          </Link>
        )}
      </div>
    </header>
  );
}
