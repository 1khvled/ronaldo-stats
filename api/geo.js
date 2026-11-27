/**
 * GET /api/geo
 * Lightweight European visitor detection backed by Vercel edge geolocation headers.
 * Never logs or stores IPs; returns only continent/country classification.
 */
const EUROPE_COUNTRIES = new Set([
  "FR", "ES", "PT", "DE", "IT", "GB", "UK", "NL", "BE", "CH", "AT", "RO", "PL",
  "SE", "NO", "DK", "FI", "IE", "GR", "CZ", "HU", "SK", "BG", "HR", "RS", "SI",
  "LT", "LV", "EE", "LU", "MT", "CY", "IS", "UA", "MD", "AL", "MK", "ME", "BA",
  "XK", "AD", "MC", "SM", "LI", "BY", "FO", "GI", "GG", "JE", "IM"
]);

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "x-vercel-ip-continent, x-vercel-ip-country");

  const continent = String(req.headers["x-vercel-ip-continent"] || "").trim().toUpperCase();
  const country = String(req.headers["x-vercel-ip-country"] || "").trim().toUpperCase();
  const known = Boolean(continent || country);
  const isEurope = country
    ? (EUROPE_COUNTRIES.has(country) || (continent === "EU" && country !== "XX"))
    : (continent === "EU");

  return res.status(200).json({ isEurope, known, country, continent });
}
