"""Pure decision engine (no I/O). Every number the app shows comes from here, never from the LLM."""

from __future__ import annotations

import math
from typing import TypedDict

BREAKPOINTS = (
    (0, 30, 0, 50),
    (30, 60, 51, 100),
    (60, 90, 101, 200),
    (90, 120, 201, 300),
    (120, 250, 301, 400),
    (250, 500, 401, 500),
)
CATEGORIES = ("Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe")
CO2_KG_PER_KM = {"car": 0.154, "bike": 0.051, "bus": 0.08, "metro": 0.03, "cycle": 0.0}


class Action(TypedDict):
    code: str
    en: str
    hi: str
    why_en: str
    why_hi: str


def clamp(v: float, lo: float, hi: float) -> float:
    """Clamp a numerical value within the specified [lo, hi] bounds.

    Args:
        v: Input float value.
        lo: Lower bound.
        hi: Upper bound.

    Returns:
        Clamped float value.
    """
    return max(lo, min(hi, v))


def aqi_from_pm25(pm25: float) -> tuple[int, int]:
    """Calculate India CPCB NAQI sub-index for PM2.5 (24h mean in ug/m3).

    Args:
        pm25: Measured or modeled PM2.5 concentration in ug/m3.

    Returns:
        A tuple of (aqi_value, band_index) where band_index is 0..5.
    """
    pm = 0.0 if math.isnan(pm25) else clamp(float(pm25), 0.0, 500.0)
    for band, (lo, hi, a, b) in enumerate(BREAKPOINTS):
        if pm <= hi:
            return round(a + (pm - lo) * (b - a) / (hi - lo)), band
    raise AssertionError("unreachable")  # pragma: no cover


def risk_score(age: int, has_condition: bool, pregnant: bool, hours_outside: float, band: int) -> int:
    """Determine personalized vulnerability risk level from 1 (lowest) to 5 (highest).

    Considers physiological vulnerability (extremes of age, pregnancy, respiratory/cardiac
    comorbidities) and exposure duration during elevated smog levels.

    Args:
        age: Age in years.
        has_condition: Whether member has asthma, COPD, or cardiac illness.
        pregnant: Pregnancy status.
        hours_outside: Daily planned outdoor hours.
        band: CPCB AQI band index (0=Good to 5=Severe).

    Returns:
        Vulnerability risk score capped at 5.
    """
    score = band
    if age <= 5 or age >= 60:
        score += 1
    if has_condition and band >= 2:
        score += 1
    if pregnant and band >= 2:
        score += 1
    if hours_outside >= 4 and band >= 2:
        score += 1
    return min(5, score)


def _a(code: str, en: str, hi: str, why_en: str, why_hi: str) -> Action:
    """Construct a bilingual Action dictionary."""
    return {"code": code, "en": en, "hi": hi, "why_en": why_en, "why_hi": why_hi}


def actions_for(age: int, has_condition: bool, pregnant: bool, band: int) -> list[Action]:
    """Generate prioritized, actionable protective measures tailored to an individual.

    Args:
        age: Age in years.
        has_condition: Comorbidity flag.
        pregnant: Pregnancy flag.
        band: CPCB AQI category band (0..5).

    Returns:
        List of Action dictionaries containing bilingual recommendations and rationales.
    """
    out: list[Action] = []
    if band <= 1:
        out.append(
            _a(
                "normal",
                "Normal outdoor activity is fine today.",
                "आज बाहर की सामान्य गतिविधि ठीक है।",
                "Air is in the Good/Satisfactory band.",
                "हवा अच्छी/संतोषजनक श्रेणी में है।",
            )
        )
    if band >= 3:
        out.append(
            _a(
                "indoor_exercise",
                "Do exercise and play indoors.",
                "कसरत और खेल घर के अंदर करें।",
                "Heavy breathing pulls more PM2.5 deep into the lungs.",
                "तेज़ सांस से PM2.5 फेफड़ों में और गहराई तक जाता है।",
            )
        )
        if age >= 2:
            out.append(
                _a(
                    "n95",
                    "If you must go out, wear a well-fitted N95.",
                    "बाहर जाना ज़रूरी हो तो सही फिट वाला N95 पहनें।",
                    "Cloth and surgical masks block very little fine dust.",
                    "कपड़े और सर्जिकल मास्क बारीक धूल कम रोकते हैं।",
                )
            )
    if band >= 2:
        if age < 2:
            out.append(
                _a(
                    "infant",
                    "Keep the baby indoors; never put a mask on an infant.",
                    "शिशु को घर में रखें; शिशु को मास्क कभी न पहनाएं।",
                    "Masks are a suffocation risk for babies.",
                    "शिशुओं के लिए मास्क दम घुटने का जोखिम है।",
                )
            )
        if has_condition:
            out.append(
                _a(
                    "reliever",
                    "Keep reliever medicine handy and follow your doctor's plan.",
                    "राहत वाली दवा पास रखें और डॉक्टर की सलाह मानें।",
                    "Smog can trigger asthma, COPD and heart symptoms.",
                    "स्मॉग से दमा, COPD और दिल के लक्षण बढ़ सकते हैं।",
                )
            )
        if age >= 60:
            out.append(
                _a(
                    "elder",
                    "Skip the early-morning walk; walk after midday, indoors if possible.",
                    "सुबह की सैर छोड़ें; दोपहर बाद, हो सके तो घर के अंदर टहलें।",
                    "Cold mornings trap smoke close to the ground.",
                    "ठंडी सुबह में धुआं ज़मीन के पास जमा रहता है।",
                )
            )
        if pregnant:
            out.append(
                _a(
                    "pregnant",
                    "Limit time outdoors and avoid traffic-heavy roads.",
                    "बाहर कम रहें और भीड़ वाली सड़कों से बचें।",
                    "Fine particles are linked to risks in pregnancy.",
                    "बारीक कण गर्भावस्था में जोखिम से जुड़े हैं।",
                )
            )
        out.append(
            _a(
                "medical",
                "Seek medical care for breathlessness, chest pain or dizziness.",
                "सांस फूलने, सीने में दर्द या चक्कर पर डॉक्टर को दिखाएं।",
                "These can be signs of a serious reaction.",
                "ये गंभीर प्रतिक्रिया के संकेत हो सकते हैं।",
            )
        )
    return out


def purifier_cadr(area_m2: float, height_m: float) -> int:
    """Calculate recommended clean-air delivery rate (CADR in m3/h) for 5 air changes per hour (ACH).

    Args:
        area_m2: Room floor area in square meters.
        height_m: Room ceiling height in meters.

    Returns:
        Recommended CADR capacity in cubic meters per hour.
    """
    return round(clamp(area_m2, 1, 500) * clamp(height_m, 2, 6) * 5)


def yearly_co2_kg(mode: str, km_one_way: float, days_per_week: float) -> float:
    """Estimate annual commuting carbon footprint based on transport mode and distance.

    Args:
        mode: Commuting mode (car, bike, bus, metro, cycle).
        km_one_way: One-way commute distance in kilometers.
        days_per_week: Number of commuting days per week.

    Returns:
        Annual emissions in kilograms of CO2 equivalent.

    Raises:
        ValueError: If an unsupported mode is provided.
    """
    if mode not in CO2_KG_PER_KM:
        raise ValueError(f"unknown mode: {mode}")
    return CO2_KG_PER_KM[mode] * clamp(km_one_way, 0, 200) * 2 * clamp(days_per_week, 0, 7) * 52
