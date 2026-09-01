// Small helpers for turning a YouTube link into the pieces we need:
// the video ID (used for the thumbnail image and the embedded player).

// Accepts the common YouTube URL shapes and returns the 11-character video ID,
// or null if we can't find one.
export function extractYouTubeId(input) {
  if (!input) return null;
  const url = String(input).trim();

  // If someone pasted just the raw ID (11 chars), accept it as-is.
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/, // https://youtu.be/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, // .../embed/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, // .../shorts/ID
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/, // .../live/ID
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function thumbnailUrl(youtubeId) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function embedUrl(youtubeId) {
  return `https://www.youtube.com/embed/${youtubeId}`;
}

export function watchUrl(youtubeId) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
