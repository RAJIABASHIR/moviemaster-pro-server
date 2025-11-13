export function validateMoviePayload(body) {
  const required = ["title", "genre", "releaseYear", "rating", "posterUrl"];
  const missing = required.filter(k => body[k] === undefined || body[k] === "");
  if (missing.length) return `Missing required fields: ${missing.join(", ")}`;
  if (Number(body.rating) < 0 || Number(body.rating) > 10) return "Rating must be 0..10";
  return null;
}