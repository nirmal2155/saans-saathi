/**
 * state.js — Application state management, validation and persistence.
 * Zero DOM interactions; pure logic for unit testing.
 */

export const STORAGE_KEY = "saans_saathi_state_v1";

/**
 * Bounds checking and sanitization helper.
 * @param {any} val
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @returns {number}
 */
export function clamp(val, min, max, fallback = min) {
  const num = Number(val);
  return Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : fallback;
}

/** Supported commute modes with emission factors in kg CO2/km (MoEFCC/IPCC baseline). */
export const MODES = {
  car: { en: "Petrol car", hi: "पेट्रोल कार", factor: 0.154 },
  bike: { en: "Scooter / bike", hi: "स्कूटर / बाइक", factor: 0.051 },
  bus: { en: "City bus", hi: "सिटी बस", factor: 0.080 },
  metro: { en: "Metro / train", hi: "मेट्रो / ट्रेन", factor: 0.030 },
  cycle: { en: "Cycle / walk", hi: "साइकिल / पैदल", factor: 0.000 },
};

export const INITIAL_STATE = {
  lang: "en",
  tab: 0,
  aqiSource: "manual", // 'auto' (location/geocoding) or 'manual' (slider fallback)
  lat: null,
  lon: null,
  cityLabel: "",
  pm: 150, // Manual PM2.5 fallback
  area: 14, // Room area in m2 (typical bedroom ~150 sq ft)
  ht: 2.7, // Ceiling height in meters (~9 ft)
  mode: "car",
  km: 12,
  days: 5,
  fam: [
    { name: "Child", age: 6, has_condition: false, pregnant: false, hours_outside: 2 },
    { name: "Grandparent", age: 68, has_condition: true, pregnant: false, hours_outside: 1 },
  ],
  airData: null,
  planData: null,
  summaryData: null,
};

/**
 * Validate and clean loaded raw state.
 * @param {any} raw
 * @returns {typeof INITIAL_STATE}
 */
export function validateState(raw) {
  if (!raw || typeof raw !== "object") return { ...INITIAL_STATE };
  const s = { ...INITIAL_STATE, ...raw };
  s.lang = s.lang === "hi" ? "hi" : "en";
  s.tab = clamp(s.tab, 0, 3, 0);
  s.pm = clamp(s.pm, 0, 500, 150);
  s.area = clamp(s.area, 1, 500, 14);
  s.ht = clamp(s.ht, 2, 6, 2.7);
  s.km = clamp(s.km, 0, 200, 12);
  s.days = clamp(s.days, 0, 7, 5);
  s.mode = MODES[s.mode] ? s.mode : "car";
  s.fam = Array.isArray(s.fam)
    ? s.fam.slice(0, 8).map(m => ({
        name: String(m.name || "").slice(0, 24),
        age: clamp(m.age, 0, 110, 30),
        has_condition: Boolean(m.has_condition),
        pregnant: Boolean(m.pregnant),
        hours_outside: clamp(m.hours_outside, 0, 16, 2),
      }))
    : [...INITIAL_STATE.fam];

  // Do not persist volatile API results
  s.airData = null;
  s.planData = null;
  s.summaryData = null;
  return s;
}

let _state = validateState(null);

export function loadStoredState(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return _state;
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    _state = validateState(raw);
  } catch (_) {
    _state = validateState(null);
  }
  return _state;
}

export function getState() {
  return _state;
}

export function setState(patch, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  Object.assign(_state, patch);
  persistState(storage);
}

export function setMember(index, patch, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  _state.fam = _state.fam.map((m, i) => (i === index ? { ...m, ...patch } : m));
  persistState(storage);
}

export function addMember(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (_state.fam.length >= 8) return false;
  _state.fam = [
    ..._state.fam,
    { name: "", age: 30, has_condition: false, pregnant: false, hours_outside: 2 },
  ];
  persistState(storage);
  return true;
}

export function removeMember(index, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  _state.fam = _state.fam.filter((_, i) => i !== index);
  persistState(storage);
}

export function persistState(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return;
  try {
    const toSave = {
      lang: _state.lang,
      tab: _state.tab,
      aqiSource: _state.aqiSource,
      lat: _state.lat,
      lon: _state.lon,
      cityLabel: _state.cityLabel,
      pm: _state.pm,
      area: _state.area,
      ht: _state.ht,
      mode: _state.mode,
      km: _state.km,
      days: _state.days,
      fam: _state.fam,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (_) {
    // Gracefully ignore storage quota exceeded
  }
}
