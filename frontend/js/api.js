/**
 * api.js — All backend network communication.
 * Kept pure, modular and testable.
 * Never stores or exposes secrets (handled server-side).
 */

const BASE_URL = "";

/**
 * Proxy city geocoding through backend to respect CSP and avoid client-side API exposure.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{name: string, latitude: number, longitude: number, country: string, admin1: string}>>}
 */
export async function geocodeCity(query, signal) {
  if (!query || query.trim().length < 2) return [];
  const url = `${BASE_URL}/api/geocode?q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url, { signal: signal || AbortSignal.timeout(8000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Geocoding failed (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Fetch 24-hour mean PM2.5 and AQI for coordinates from backend (Open-Meteo CAMS estimate).
 * @param {number} lat
 * @param {number} lon
 * @param {AbortSignal} [signal]
 * @returns {Promise<{pm25: number, aqi: number, category: string, source: string}>}
 */
export async function fetchAir(lat, lon, signal) {
  const url = `${BASE_URL}/api/air?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const res = await fetch(url, { signal: signal || AbortSignal.timeout(10000) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Air quality request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Compute personalized family risk scores and action plan.
 * @param {number} pm25
 * @param {Array<{name: string, age: number, has_condition: boolean, pregnant: boolean, hours_outside: number}>} members
 * @param {AbortSignal} [signal]
 * @returns {Promise<{aqi: number, category: string, members: Array<object>}>}
 */
export async function fetchPlan(pm25, members, signal) {
  const res = await fetch(`${BASE_URL}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pm25, members }),
    signal: signal || AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Plan calculation failed (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch concise Gemini summary grounded in computed facts (falls back to rule engine).
 * @param {number} pm25
 * @param {string} [question]
 * @param {"en"|"hi"} [lang="en"]
 * @param {AbortSignal} [signal]
 * @returns {Promise<{text: string, source: "gemini"|"rules"}>}
 */
export async function fetchSummary(pm25, question = "", lang = "en", signal) {
  const res = await fetch(`${BASE_URL}/api/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pm25,
      question: String(question || "").slice(0, 300),
      lang: lang === "hi" ? "hi" : "en",
    }),
    signal: signal || AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Summary request failed (${res.status})`);
  }
  return res.json();
}
