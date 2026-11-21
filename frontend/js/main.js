/**
 * main.js — Application entrypoint and coordinator.
 * Coordinates State, Network (API), and View (UI) without tight coupling.
 * Debounces all rapid user interactions for maximum efficiency.
 */

import { fetchAir, fetchPlan, fetchSummary, geocodeCity } from "./api.js";
import {
  getState,
  setState,
  setMember,
  addMember,
  removeMember,
  loadStoredState,
} from "./state.js";
import { t, T } from "./i18n.js";
import {
  el,
  renderTodayPanel,
  renderFamilyPanel,
  renderIndoorPanel,
  renderImpactPanel,
  renderLocationCard,
  getBandIndexByCategory,
  getBandIndexByPm,
} from "./ui.js";

/* ── Debounce Utility ─────────────────────────────────────────── */
function debounce(fn, delayMs) {
  let timerId = null;
  return (...args) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delayMs);
  };
}

/* ── Transient UI State (Non-persisted) ───────────────────────── */
let _airLoading = false;
let _airError = "";
let _planLoading = false;
let _planError = "";
let _summaryLoading = false;
let _summaryError = "";
let _locLoading = false;
let _locError = "";

/* ── Global Render Function ───────────────────────────────────── */
export function renderApp() {
  const S = getState();
  const lang = S.lang;

  // Sync document language and title
  document.documentElement.lang = lang;
  document.title = `${t(T.appTitle, lang)} — ${t(T.appTagline, lang)}`;

  // Header and Footer strings
  const titleEl = document.getElementById("app-title");
  if (titleEl) titleEl.textContent = t(T.appTitle, lang);

  const taglineEl = document.getElementById("app-tagline");
  if (taglineEl) taglineEl.textContent = t(T.appTagline, lang);

  const disclaimerEl = document.getElementById("disclaimer-text");
  if (disclaimerEl) disclaimerEl.textContent = t(T.disclaimer, lang);

  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) {
    langBtn.textContent = t(T.switchLang, lang);
    langBtn.setAttribute("aria-label", `Switch to ${S.lang === "hi" ? "English" : "हिन्दी"}`);
  }

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.setAttribute("aria-label", t(T.darkMode, lang));
  }

  // Render Top Location Card
  const locMount = document.getElementById("location-mount");
  if (locMount) {
    locMount.replaceChildren(
      renderLocationCard({
        lang,
        cityLabel: S.cityLabel,
        aqiSource: S.aqiSource,
        loading: _locLoading || _airLoading,
        error: _locError || _airError,
        onSearchCity: handleCitySearch,
        onUseLocation: handleUseLocation,
      })
    );
  }

  // Render Accessible Tablist
  const tabList = document.getElementById("main-tablist");
  if (tabList) {
    const tabKeys = ["tabToday", "tabFamily", "tabIndoor", "tabImpact"];
    tabList.replaceChildren(
      ...tabKeys.map((key, idx) => {
        const isSelected = S.tab === idx;
        const tabBtn = el("button", {
          type: "button",
          role: "tab",
          id: `tab-btn-${idx}`,
          class: isSelected ? "tab-btn active" : "tab-btn",
          "aria-selected": String(isSelected),
          "aria-controls": "main-tabpanel",
          tabindex: isSelected ? "0" : "-1",
          textContent: t(T[key], lang),
        });

        tabBtn.addEventListener("click", () => {
          setState({ tab: idx });
          renderApp();
        });

        tabBtn.addEventListener("keydown", e => {
          let targetIdx = null;
          if (e.key === "ArrowRight") targetIdx = (S.tab + 1) % 4;
          else if (e.key === "ArrowLeft") targetIdx = (S.tab + 3) % 4;
          else if (e.key === "Home") targetIdx = 0;
          else if (e.key === "End") targetIdx = 3;

          if (targetIdx !== null) {
            e.preventDefault();
            setState({ tab: targetIdx });
            renderApp();
            document.getElementById(`tab-btn-${targetIdx}`)?.focus();
          }
        });

        return tabBtn;
      })
    );
  }

  // Render Active Tabpanel
  const panel = document.getElementById("main-tabpanel");
  if (!panel) return;
  panel.setAttribute("aria-labelledby", `tab-btn-${S.tab}`);

  const bandIdx = S.airData ? getBandIndexByCategory(S.airData.category) : getBandIndexByPm(S.pm);

  if (S.tab === 0) {
    panel.replaceChildren(
      renderTodayPanel({
        lang,
        airData: S.airData,
        pm: S.pm,
        aqiSource: S.aqiSource,
        summaryData: S.summaryData,
        summaryLoading: _summaryLoading,
        summaryError: _summaryError,
        onManualPmChange: debouncedManualPmChange,
        onAskQuestion: handleAskSummaryQuestion,
      })
    );
  } else if (S.tab === 1) {
    panel.replaceChildren(
      renderFamilyPanel({
        lang,
        fam: S.fam,
        planData: S.planData,
        planLoading: _planLoading,
        planError: _planError,
        onMemberChange(idx, patch) {
          setMember(idx, patch);
          debouncedPlanFetch();
          renderApp();
        },
        onAddMember() {
          if (addMember()) {
            triggerPlanFetch();
            renderApp();
          }
        },
        onRemoveMember(idx) {
          removeMember(idx);
          triggerPlanFetch();
          renderApp();
        },
      })
    );
  } else if (S.tab === 2) {
    panel.replaceChildren(
      renderIndoorPanel({
        lang,
        bandIdx,
        area: S.area,
        ht: S.ht,
        onAreaChange(val) {
          setState({ area: val });
          renderApp();
        },
        onHtChange(val) {
          setState({ ht: val });
          renderApp();
        },
      })
    );
  } else if (S.tab === 3) {
    panel.replaceChildren(
      renderImpactPanel({
        lang,
        mode: S.mode,
        km: S.km,
        days: S.days,
        onModeChange(val) {
          setState({ mode: val });
          renderApp();
        },
        onKmChange(val) {
          setState({ km: val });
          renderApp();
        },
        onDaysChange(val) {
          setState({ days: val });
          renderApp();
        },
      })
    );
  }
}

/* ── Network Handlers ─────────────────────────────────────────── */

async function triggerAirFetch() {
  const S = getState();
  if (S.lat == null || S.lon == null) return;
  _airLoading = true;
  _airError = "";
  renderApp();

  try {
    const data = await fetchAir(S.lat, S.lon);
    setState({ airData: data, aqiSource: "auto" });
    _airLoading = false;
    renderApp();

    // Trigger grounded summary and plan
    triggerSummaryFetch();
    triggerPlanFetch();
  } catch (err) {
    _airLoading = false;
    _airError = t(T.airError, getState().lang);
    setState({ aqiSource: "manual" });
    renderApp();
  }
}

async function triggerPlanFetch() {
  const S = getState();
  const effectivePm = S.airData ? S.airData.pm25 : S.pm;
  _planLoading = true;
  _planError = "";
  renderApp();

  try {
    const plan = await fetchPlan(effectivePm, S.fam);
    setState({ planData: plan });
    _planLoading = false;
    renderApp();
  } catch (err) {
    _planLoading = false;
    _planError = t(T.planError, getState().lang);
    renderApp();
  }
}
const debouncedPlanFetch = debounce(triggerPlanFetch, 500);

async function triggerSummaryFetch(question = "") {
  const S = getState();
  const effectivePm = S.airData ? S.airData.pm25 : S.pm;
  _summaryLoading = true;
  _summaryError = "";
  renderApp();

  try {
    const summary = await fetchSummary(effectivePm, question, S.lang);
    setState({ summaryData: summary });
    _summaryLoading = false;
    renderApp();
  } catch (err) {
    _summaryLoading = false;
    _summaryError = String(err.message || err);
    renderApp();
  }
}

function handleAskSummaryQuestion(q) {
  triggerSummaryFetch(q);
}

const debouncedManualPmChange = debounce(newPm => {
  setState({ pm: newPm, aqiSource: "manual", airData: null });
  renderApp();
  debouncedPlanFetch();
  triggerSummaryFetch();
}, 300);

async function handleCitySearch(query) {
  _locLoading = true;
  _locError = "";
  renderApp();

  try {
    const results = await geocodeCity(query);
    if (!results || results.length === 0) {
      _locLoading = false;
      _locError = `No cities found matching "${query}". Try another spelling.`;
      renderApp();
      return;
    }

    const top = results[0];
    const labelParts = [top.name, top.admin1, top.country].filter(Boolean);
    _locLoading = false;
    setState({
      lat: top.latitude,
      lon: top.longitude,
      cityLabel: labelParts.join(", "),
    });
    renderApp();
    await triggerAirFetch();
  } catch (err) {
    _locLoading = false;
    _locError = t(T.airError, getState().lang);
    renderApp();
  }
}

function handleUseLocation() {
  if (!navigator.geolocation) {
    _locError = t(T.geoDenied, getState().lang);
    renderApp();
    return;
  }

  _locLoading = true;
  _locError = "";
  renderApp();

  navigator.geolocation.getCurrentPosition(
    pos => {
      _locLoading = false;
      setState({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        cityLabel: `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
      });
      renderApp();
      triggerAirFetch();
    },
    () => {
      _locLoading = false;
      _locError = t(T.geoDenied, getState().lang);
      setState({ aqiSource: "manual" });
      renderApp();
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}

/* ── DOM Bootstrap ────────────────────────────────────────────── */
export function initApp() {
  loadStoredState();

  // Language switch listener
  document.getElementById("lang-toggle-btn")?.addEventListener("click", () => {
    const nextLang = getState().lang === "hi" ? "en" : "hi";
    setState({ lang: nextLang });
    renderApp();
    // Refresh summary in new language
    triggerSummaryFetch();
  });

  // Dark mode toggle listener
  const rootEl = document.documentElement;
  const savedTheme = localStorage.getItem("saans_theme");
  if (savedTheme) {
    rootEl.setAttribute("data-theme", savedTheme);
  }

  document.getElementById("theme-toggle-btn")?.addEventListener("click", () => {
    const isDark = rootEl.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    rootEl.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("saans_theme", nextTheme);
    } catch (_) {}
  });

  renderApp();

  // Initial data population
  triggerPlanFetch();
  triggerSummaryFetch();
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}
