/**
 * ui.js — Pure DOM rendering and accessibility layer.
 * Strictly adheres to WCAG 2.2 AA.
 * Absolutely NO innerHTML anywhere — all DOM manipulation via createElement / textContent.
 */

import { t, T } from "./i18n.js";
import { clamp, MODES } from "./state.js";

/**
 * CPCB NAQI Categories and verified WCAG 2.2 AA compliant colors.
 * Every background color has >= 4.5:1 contrast against white (#ffffff) text.
 */
export const AQI_BANDS = [
  { en: "Good", hi: "अच्छा", bg: "#1b5e20", fg: "#ffffff", minPm: 0, maxPm: 30, minAqi: 0, maxAqi: 50 },
  { en: "Satisfactory", hi: "संतोषजनक", bg: "#33691e", fg: "#ffffff", minPm: 30, maxPm: 60, minAqi: 51, maxAqi: 100 },
  { en: "Moderate", hi: "मध्यम", bg: "#945300", fg: "#ffffff", minPm: 60, maxPm: 90, minAqi: 101, maxAqi: 200 },
  { en: "Poor", hi: "खराब", bg: "#b71c1c", fg: "#ffffff", minPm: 90, maxPm: 120, minAqi: 201, maxAqi: 300 },
  { en: "Very Poor", hi: "बहुत खराब", bg: "#880e4f", fg: "#ffffff", minPm: 120, maxPm: 250, minAqi: 301, maxAqi: 400 },
  { en: "Severe", hi: "गंभीर", bg: "#4a148c", fg: "#ffffff", minPm: 250, maxPm: 500, minAqi: 401, maxAqi: 500 },
];

export function getBandIndexByCategory(category) {
  const idx = AQI_BANDS.findIndex(b => b.en.toLowerCase() === String(category || "").toLowerCase());
  return idx >= 0 ? idx : 0;
}

export function getBandIndexByPm(pm25) {
  const pm = clamp(pm25, 0, 500, 0);
  for (let i = 0; i < AQI_BANDS.length; i++) {
    if (pm <= AQI_BANDS[i].maxPm || i === AQI_BANDS.length - 1) return i;
  }
  return 0;
}

export function estimateAqiFromPm(pm25) {
  const pm = clamp(pm25, 0, 500, 0);
  const band = AQI_BANDS[getBandIndexByPm(pm)];
  return Math.round(band.minAqi + ((pm - band.minPm) * (band.maxAqi - band.minAqi)) / (band.maxPm - band.minPm));
}

/**
 * Safe DOM element creator. Never accepts HTML markup.
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (val == null) continue;
    if (key === "class" || key === "className") {
      node.className = String(val);
    } else if (key === "textContent") {
      node.textContent = String(val);
    } else if (key.startsWith("on") && typeof val === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (typeof val === "boolean") {
      if (val) node.setAttribute(key, "");
      else node.removeAttribute(key);
    } else {
      node.setAttribute(key, String(val));
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child == null) continue;
    if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }
  return node;
}

let _idCounter = 0;
export function createLabeledField(labelText, inputNode) {
  const id = `fld_${++_idCounter}`;
  inputNode.id = id;
  const label = el("label", { for: id, textContent: labelText });
  return el("div", { class: "form-group" }, label, inputNode);
}

export function createNumberInput({ value, min, max, step, ariaLabel, onChange }) {
  const inp = el("input", {
    type: "number",
    min: String(min),
    max: String(max),
    step: String(step),
    value: String(value),
    "aria-label": ariaLabel || "",
    inputmode: "decimal",
  });
  inp.addEventListener("change", e => {
    const valid = clamp(e.target.value, min, max, value);
    e.target.value = String(valid);
    onChange(valid);
  });
  return inp;
}

export function createWhyCollapsible(lang, explanation) {
  return el(
    "details",
    { class: "why-details" },
    el("summary", { textContent: t(T.whyLabel, lang) }),
    el("p", { class: "why-text", textContent: explanation })
  );
}

export function createAqiBadge(bandIndex, lang) {
  const band = AQI_BANDS[bandIndex] || AQI_BANDS[0];
  const badge = el("span", {
    class: "pill aqi-badge",
    textContent: lang === "hi" ? band.hi : band.en,
  });
  badge.style.backgroundColor = band.bg;
  badge.style.color = band.fg;
  return badge;
}

/* ─────────────────────────────────────────────────────────────────
   PANEL RENDERERS
   ───────────────────────────────────────────────────────────────── */

/**
 * 1. Today & Low-Emission Routines Panel
 */
export function renderTodayPanel(opts) {
  const {
    lang,
    airData,
    pm,
    aqiSource,
    summaryData,
    summaryLoading,
    summaryError,
    onManualPmChange,
    onAskQuestion,
  } = opts;

  const currentPm = airData ? airData.pm25 : pm;
  const aqiVal = airData ? airData.aqi : estimateAqiFromPm(pm);
  const bandIdx = airData ? getBandIndexByCategory(airData.category) : getBandIndexByPm(pm);
  const band = AQI_BANDS[bandIdx];

  const container = el("div", { class: "panel-today", "aria-live": "polite" });

  // Main AQI Hero Display
  const numBadge = el("div", {
    class: "aqi-num-hero",
    "aria-label": `${t(T.aqiLabel, lang)}: ${aqiVal}, ${lang === 'hi' ? band.hi : band.en}`,
    textContent: String(aqiVal),
  });
  numBadge.style.backgroundColor = band.bg;
  numBadge.style.color = band.fg;

  const heroDetails = el(
    "div",
    { class: "aqi-hero-meta" },
    el("h2", { class: "aqi-hero-title" }, t(T.aqiLabel, lang), " · ", createAqiBadge(bandIdx, lang)),
    el("p", { class: "health-msg", textContent: t(T.healthDescriptions[bandIdx], lang) }),
    el(
      "p",
      { class: "pm-reading" },
      `${t(T.pm25Label, lang)}: `,
      el("strong", { textContent: `${currentPm.toFixed(1)} ${t(T.ugm3, lang)}` })
    )
  );

  const heroCard = el("section", { class: "card aqi-hero-card" }, el("div", { class: "big-row" }, numBadge, heroDetails));

  if (airData) {
    heroCard.appendChild(
      el("p", { class: "note model-tag", textContent: `ℹ️ ${t(T.modelEstimateBadge, lang)}` })
    );
  }

  container.appendChild(heroCard);

  // Manual fallback PM2.5 slider (always functional and accessible)
  const manualCard = el("section", { class: "card manual-card" });
  const sliderLabel = el("label", { for: "pm-range-slider", textContent: t(T.manualFallbackHeading, lang) });
  const sliderValDisplay = el("span", { class: "slider-val", textContent: ` ${pm} ${t(T.ugm3, lang)}` });
  sliderLabel.appendChild(sliderValDisplay);

  const rangeInput = el("input", {
    type: "range",
    id: "pm-range-slider",
    min: "0",
    max: "500",
    step: "1",
    value: String(pm),
    "aria-label": t(T.manualFallbackHeading, lang),
  });
  rangeInput.addEventListener("input", e => {
    const val = clamp(e.target.value, 0, 500, pm);
    sliderValDisplay.textContent = ` ${val} ${t(T.ugm3, lang)}`;
    onManualPmChange(val);
  });

  const presetButtons = el(
    "div",
    { class: "preset-row", role: "group", "aria-label": "PM2.5 Presets" },
    ...[
      { label_en: "Clean Day (15)", label_hi: "स्वच्छ दिन (15)", val: 15 },
      { label_en: "Moderate (75)", label_hi: "मध्यम (75)", val: 75 },
      { label_en: "Winter Smog (160)", label_hi: "सर्दियों का स्मॉग (160)", val: 160 },
      { label_en: "Severe Smog (350)", label_hi: "गंभीर स्मॉग (350)", val: 350 },
    ].map(p =>
      el("button", {
        type: "button",
        class: "btn-sm",
        textContent: lang === "hi" ? p.label_hi : p.label_en,
        onclick() {
          rangeInput.value = String(p.val);
          sliderValDisplay.textContent = ` ${p.val} ${t(T.ugm3, lang)}`;
          onManualPmChange(p.val);
        },
      })
    )
  );

  manualCard.appendChild(sliderLabel);
  manualCard.appendChild(rangeInput);
  manualCard.appendChild(presetButtons);
  container.appendChild(manualCard);

  // Low-emission daily routines
  const routineCard = el("section", { class: "card routine-card" });
  routineCard.appendChild(el("h2", { textContent: t(T.routineHeading, lang) }));

  const routineList = el("ul", { class: "routine-list" });
  for (const item of T.routineItems) {
    const title = lang === "hi" ? item.title_hi : item.title_en;
    const why = lang === "hi" ? item.why_hi : item.why_en;
    routineList.appendChild(
      el("li", {}, el("span", { class: "routine-title", textContent: title }), createWhyCollapsible(lang, why))
    );
  }
  routineCard.appendChild(routineList);
  container.appendChild(routineCard);

  // GenAI Guide summary card
  const summaryCard = el("section", { class: "card summary-card", "aria-live": "polite" });
  summaryCard.appendChild(el("h2", { textContent: t(T.summaryHeading, lang) }));

  if (summaryLoading) {
    summaryCard.appendChild(
      el("p", { class: "loading-text", role: "status", textContent: `⏳ ${t(T.summaryLoading, lang)}` })
    );
  } else if (summaryError) {
    summaryCard.appendChild(el("p", { class: "error-text", role: "alert", textContent: summaryError }));
  } else if (summaryData) {
    summaryCard.appendChild(el("p", { class: "summary-body", textContent: summaryData.text }));
    const srcText = summaryData.source === "gemini" ? t(T.sourceGemini, lang) : t(T.sourceRules, lang);
    summaryCard.appendChild(el("p", { class: "note summary-src", textContent: `🛡️ ${srcText}` }));
  }

  // Interactive follow-up question
  const qInput = el("input", {
    type: "text",
    maxlength: "300",
    placeholder: t(T.summaryPlaceholder, lang),
    "aria-label": t(T.summaryPlaceholder, lang),
  });
  const qBtn = el("button", {
    type: "button",
    textContent: t(T.askBtn, lang),
    onclick() {
      const q = qInput.value.trim().slice(0, 300);
      if (q) onAskQuestion(q);
    },
  });
  qInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      qBtn.click();
    }
  });

  const qRow = el("div", { class: "question-row" }, qInput, qBtn);
  summaryCard.appendChild(qRow);
  container.appendChild(summaryCard);

  return container;
}

/**
 * 2. Family Care Panel
 */
export function renderFamilyPanel(opts) {
  const { lang, fam, planData, planLoading, planError, onMemberChange, onAddMember, onRemoveMember } = opts;

  const container = el("div", { class: "panel-family" });
  container.appendChild(el("h2", { textContent: t(T.familyHeading, lang) }));

  // Family Members List & Editors
  const membersWrap = el("div", { class: "family-members-wrap" });

  fam.forEach((member, idx) => {
    const card = el("div", { class: "card member-card" });

    // Header with member name and remove button
    const cardHeader = el(
      "div",
      { class: "member-card-header" },
      el("h3", { textContent: member.name || `${t(T.memberName, lang)} ${idx + 1}` }),
      el("button", {
        type: "button",
        class: "btn-sm btn-danger",
        textContent: `✕ ${t(T.removeBtn, lang)}`,
        "aria-label": `${t(T.removeBtn, lang)}: ${member.name || idx + 1}`,
        onclick: () => onRemoveMember(idx),
      })
    );
    card.appendChild(cardHeader);

    // Inputs
    const nameInp = el("input", {
      type: "text",
      maxlength: "24",
      value: member.name,
      "aria-label": t(T.memberName, lang),
    });
    nameInp.addEventListener("change", e => onMemberChange(idx, { name: e.target.value.slice(0, 24) }));

    const ageInp = createNumberInput({
      value: member.age,
      min: 0,
      max: 110,
      step: 1,
      ariaLabel: t(T.memberAge, lang),
      onChange: val => onMemberChange(idx, { age: val }),
    });

    const hoursInp = createNumberInput({
      value: member.hours_outside,
      min: 0,
      max: 16,
      step: 0.5,
      ariaLabel: t(T.memberHours, lang),
      onChange: val => onMemberChange(idx, { hours_outside: val }),
    });

    const fieldsRow = el(
      "div",
      { class: "row member-inputs" },
      createLabeledField(t(T.memberName, lang), nameInp),
      createLabeledField(t(T.memberAge, lang), ageInp),
      createLabeledField(t(T.memberHours, lang), hoursInp)
    );
    card.appendChild(fieldsRow);

    // Checkboxes
    const condId = `cond_chk_${idx}`;
    const condChk = el("input", { type: "checkbox", id: condId });
    condChk.checked = Boolean(member.has_condition);
    condChk.addEventListener("change", e => onMemberChange(idx, { has_condition: e.target.checked }));

    const pregId = `preg_chk_${idx}`;
    const pregChk = el("input", { type: "checkbox", id: pregId });
    pregChk.checked = Boolean(member.pregnant);
    pregChk.addEventListener("change", e => onMemberChange(idx, { pregnant: e.target.checked }));

    const chkRow = el(
      "div",
      { class: "member-checks" },
      el("label", { class: "chk-label", for: condId }, condChk, el("span", { textContent: t(T.memberCond, lang) })),
      el("label", { class: "chk-label", for: pregId }, pregChk, el("span", { textContent: t(T.memberPreg, lang) }))
    );
    card.appendChild(chkRow);

    membersWrap.appendChild(card);
  });

  container.appendChild(membersWrap);

  if (fam.length < 8) {
    const addBtn = el("button", {
      type: "button",
      class: "btn-primary add-member-btn",
      textContent: t(T.addMemberBtn, lang),
      onclick: onAddMember,
    });
    container.appendChild(addBtn);
  }

  // Plan Recommendations from server
  const planSection = el("section", { class: "plan-results", "aria-live": "polite" });
  if (planLoading) {
    planSection.appendChild(
      el("p", { class: "loading-text", role: "status", textContent: `⏳ ${t(T.planLoading, lang)}` })
    );
  } else if (planError) {
    planSection.appendChild(el("p", { class: "error-text", role: "alert", textContent: planError }));
  } else if (planData && Array.isArray(planData.members)) {
    planSection.appendChild(
      el("h3", {
        class: "plan-title",
        textContent: `🎯 ${t(T.familyHeading, lang)} (AQI ${planData.aqi} · ${planData.category})`,
      })
    );

    planData.members.forEach(m => {
      const recCard = el("div", { class: "card rec-card" });
      const riskColor = getRiskColor(m.risk);
      const riskPill = el("span", {
        class: "pill risk-pill",
        textContent: `${t(T.riskScoreLabel, lang)}: ${m.risk}/5`,
      });
      riskPill.style.backgroundColor = riskColor;
      riskPill.style.color = "#ffffff";

      recCard.appendChild(
        el("div", { class: "rec-header" }, el("h4", { textContent: m.name || "Family Member" }), riskPill)
      );

      const actionList = el("ul", { class: "action-list" });
      (m.actions || []).forEach(act => {
        const text = lang === "hi" ? act.hi : act.en;
        const why = lang === "hi" ? act.why_hi : act.why_en;
        actionList.appendChild(
          el("li", {}, el("span", { class: "action-text", textContent: text }), createWhyCollapsible(lang, why))
        );
      });
      recCard.appendChild(actionList);
      planSection.appendChild(recCard);
    });
  }

  container.appendChild(planSection);
  return container;
}

function getRiskColor(risk) {
  // WCAG compliant risk scale (0 = green to 5 = deep purple)
  const colors = ["#1b5e20", "#33691e", "#945300", "#b71c1c", "#880e4f", "#4a148c"];
  return colors[clamp(risk, 0, 5, 0)];
}

/**
 * 3. Indoor Air Hacks Panel
 */
export function renderIndoorPanel(opts) {
  const { lang, bandIdx, area, ht, onAreaChange, onHtChange } = opts;

  const container = el("div", { class: "panel-indoor" });
  container.appendChild(el("h2", { textContent: t(T.indoorHeading, lang) }));

  // Windows Verdict
  const winIdx = bandIdx <= 1 ? 0 : bandIdx === 2 ? 1 : 2;
  const winItem = T.windowOptions[winIdx];
  const winCard = el(
    "section",
    { class: "card window-card", "aria-live": "polite" },
    el("h3", { textContent: `🪟 ${t(T.windowsVerdict, lang)}` }),
    el("p", { class: "verdict-text", textContent: lang === "hi" ? winItem.title_hi : winItem.title_en }),
    createWhyCollapsible(lang, lang === "hi" ? winItem.why_hi : winItem.why_en)
  );
  container.appendChild(winCard);

  // CADR Purifier Sizing Calculator
  const cadrCard = el("section", { class: "card cadr-card" });
  cadrCard.appendChild(el("h3", { textContent: `💨 ${t(T.purifierHeading, lang)}` }));

  const areaInp = createNumberInput({
    value: area,
    min: 1,
    max: 500,
    step: 1,
    ariaLabel: t(T.roomArea, lang),
    onChange: onAreaChange,
  });

  const htInp = createNumberInput({
    value: ht,
    min: 2,
    max: 6,
    step: 0.1,
    ariaLabel: t(T.roomHeight, lang),
    onChange: onHtChange,
  });

  cadrCard.appendChild(
    el("div", { class: "row" }, createLabeledField(t(T.roomArea, lang), areaInp), createLabeledField(t(T.roomHeight, lang), htInp))
  );

  const cadrValue = Math.round(clamp(area, 1, 500, 14) * clamp(ht, 2, 6, 2.7) * 5);
  const cfmValue = Math.round(cadrValue * 0.589);

  cadrCard.appendChild(
    el(
      "div",
      { class: "cadr-output", "aria-live": "polite" },
      el("p", { class: "cadr-lead", textContent: t(T.cadrReq, lang) }),
      el("div", { class: "cadr-stat", textContent: `${cadrValue} m³/h  (~${cfmValue} CFM)` }),
      el("p", { class: "note", textContent: t(T.cadrFormulaNote, lang) })
    )
  );
  container.appendChild(cadrCard);

  // DIY Box Fan Filter Hack
  const diyCard = el(
    "section",
    { class: "card hack-card diy-box-fan" },
    el("h3", { textContent: `🛠️ ${t(T.diyBoxFanHeading, lang)}` }),
    el("p", { textContent: t(T.diyBoxFanBody, lang) })
  );
  container.appendChild(diyCard);

  // Cleaning Hack: Wet Mopping
  const mopCard = el(
    "section",
    { class: "card hack-card wet-mop" },
    el("h3", { textContent: `🧹 ${t(T.cleaningHackHeading, lang)}` }),
    el("p", { textContent: t(T.cleaningHackBody, lang) })
  );
  container.appendChild(mopCard);

  return container;
}

/**
 * 4. Sustainable Alternatives & Impact Panel
 */
export function renderImpactPanel(opts) {
  const { lang, mode, km, days, onModeChange, onKmChange, onDaysChange } = opts;

  const container = el("div", { class: "panel-impact" });
  container.appendChild(el("h2", { textContent: t(T.impactHeading, lang) }));

  const controlsCard = el("section", { class: "card controls-card" });

  // Mode select dropdown
  const modeSelect = el("select", { "aria-label": t(T.travelMode, lang) });
  for (const [key, item] of Object.entries(MODES)) {
    const opt = el("option", {
      value: key,
      textContent: lang === "hi" ? item.hi : item.en,
    });
    if (key === mode) opt.selected = true;
    modeSelect.appendChild(opt);
  }
  modeSelect.addEventListener("change", e => {
    if (MODES[e.target.value]) onModeChange(e.target.value);
  });

  const kmInp = createNumberInput({
    value: km,
    min: 0,
    max: 200,
    step: 1,
    ariaLabel: t(T.oneWayKm, lang),
    onChange: onKmChange,
  });

  const daysInp = createNumberInput({
    value: days,
    min: 0,
    max: 7,
    step: 1,
    ariaLabel: t(T.daysPerWeek, lang),
    onChange: onDaysChange,
  });

  controlsCard.appendChild(
    el(
      "div",
      { class: "row" },
      createLabeledField(t(T.travelMode, lang), modeSelect),
      createLabeledField(t(T.oneWayKm, lang), kmInp),
      createLabeledField(t(T.daysPerWeek, lang), daysInp)
    )
  );
  container.appendChild(controlsCard);

  // Emission calculation: kg CO2/year = factor * km * 2 * days * 52
  const chosenFactor = MODES[mode]?.factor ?? 0.154;
  const annualCo2 = Math.round(chosenFactor * clamp(km, 0, 200, 0) * 2 * clamp(days, 0, 7, 0) * 52);

  // Car baseline
  const carFactor = MODES.car.factor;
  const carAnnualCo2 = Math.round(carFactor * clamp(km, 0, 200, 0) * 2 * clamp(days, 0, 7, 0) * 52);
  const netSaved = Math.max(0, carAnnualCo2 - annualCo2);

  const resultsCard = el("section", { class: "card results-card", "aria-live": "polite" });

  resultsCard.appendChild(
    el(
      "div",
      { class: "stat-row" },
      el("span", { class: "stat-label", textContent: t(T.annualCo2, lang) }),
      el("span", { class: "stat-num", textContent: `${annualCo2} ${t(T.kgCo2Year, lang)}` })
    )
  );

  if (mode !== "car") {
    resultsCard.appendChild(
      el(
        "div",
        { class: "stat-row savings-row" },
        el("span", { class: "stat-label", textContent: `🌿 ${t(T.annualSavingsVsCar, lang)}` }),
        el("span", { class: "stat-num savings-num", textContent: `${netSaved} ${t(T.kgCo2Year, lang)}` })
      )
    );
  }

  resultsCard.appendChild(el("p", { class: "note assumptions-text", textContent: t(T.impactAssumptions, lang) }));
  container.appendChild(resultsCard);

  return container;
}

/**
 * 5. Location Search Card (Top of page)
 */
export function renderLocationCard(opts) {
  const { lang, cityLabel, aqiSource, loading, error, onSearchCity, onUseLocation } = opts;

  const card = el("section", { class: "card location-card", role: "region", "aria-label": t(T.locationHeading, lang) });
  card.appendChild(el("h2", { textContent: `📍 ${t(T.locationHeading, lang)}` }));

  // Search input & button
  const searchInput = el("input", {
    type: "search",
    placeholder: t(T.cityPlaceholder, lang),
    "aria-label": t(T.searchCity, lang),
    autocomplete: "off",
  });
  const searchButton = el("button", {
    type: "button",
    class: "btn-secondary",
    textContent: `🔍 ${t(T.searchBtn, lang)}`,
    onclick: () => {
      const q = searchInput.value.trim();
      if (q.length >= 2) onSearchCity(q);
    },
  });
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchButton.click();
    }
  });

  const locButton = el("button", {
    type: "button",
    class: "btn-primary",
    textContent: `🎯 ${t(T.useLocation, lang)}`,
    onclick: onUseLocation,
  });

  const searchRow = el("div", { class: "loc-controls-row" }, searchInput, searchButton, locButton);
  card.appendChild(searchRow);

  const statusWrap = el("div", { class: "loc-status-wrap", "aria-live": "polite" });
  if (loading) {
    statusWrap.appendChild(
      el("p", { class: "loading-text", role: "status", textContent: `⏳ ${t(T.airLoading, lang)}` })
    );
  } else if (error) {
    statusWrap.appendChild(el("p", { class: "error-text", role: "alert", textContent: error }));
  } else if (cityLabel) {
    statusWrap.appendChild(
      el("p", { class: "active-city-label", textContent: `📍 ${cityLabel}` })
    );
  }
  card.appendChild(statusWrap);

  return card;
}
