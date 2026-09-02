// Month number (1-12) <-> name helpers. Data stores the number; the UI shows
// the name. Anything outside 1-12 (including 0 and #N/A) is treated as "no month".
export const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(n) {
  const i = Number(n);
  return i >= 1 && i <= 12 ? MONTH_NAMES[i] : "";
}

// Parse a raw cell value into a valid month number, or null.
export function parseMonth(v) {
  if (v == null) return null;
  const t = String(v).trim();
  if (!t || t.toUpperCase() === "#N/A") return null;
  const n = parseInt(t, 10);
  return n >= 1 && n <= 12 ? n : null;
}
