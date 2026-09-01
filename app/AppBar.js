import Link from "next/link";

export default function AppBar({ action }) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <h1>🌾 Farmer Video Finder</h1>
        {action || (
          <Link href="/manage" aria-label="Manage entries">
            Manage
          </Link>
        )}
      </div>
    </header>
  );
}
