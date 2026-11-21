/**
 * i18n.js — Comprehensive bilingual dictionary (English & Hindi).
 * Fully synchronized: every entry contains complete 'en' and 'hi' text.
 */

export const T = {
  // Shell & metadata
  appTitle: {
    en: "SaansSaathi",
    hi: "सांससाथी",
  },
  appTagline: {
    en: "Family Smog Guardian: Navigate severe urban air pollution with actionable advice.",
    hi: "परिवार स्मॉग रक्षक: गंभीर शहरी वायु प्रदूषण से निपटने के लिए व्यावहारिक उपाय।",
  },
  disclaimer: {
    en: "General guidance, not medical advice. AQI is estimated from PM2.5 (CPCB NAQI breakpoints) using an Open-Meteo CAMS atmospheric model value — not a physical monitoring station. Consult a physician for acute respiratory distress.",
    hi: "यह सामान्य मार्गदर्शन है, चिकित्सकीय परामर्श नहीं। AQI यहाँ Open-Meteo CAMS वायुमंडलीय मॉडल के PM2.5 से CPCB NAQI सीमाओं के अनुसार अनुमानित है — स्टेशन रीडिंग नहीं। सांस की तीव्र तकलीफ़ में तुरंत डॉक्टर से संपर्क करें।",
  },
  skipLink: {
    en: "Skip to main content",
    hi: "मुख्य सामग्री पर जाएं",
  },
  switchLang: {
    en: "हिन्दी",
    hi: "English",
  },
  darkMode: {
    en: "Toggle dark mode",
    hi: "डार्क मोड टॉगल करें",
  },

  // Navigation tabs
  tabToday: {
    en: "Today & Actions",
    hi: "आज और कदम",
  },
  tabFamily: {
    en: "Family Care",
    hi: "परिवार की देखभाल",
  },
  tabIndoor: {
    en: "Indoor Air Hacks",
    hi: "घर के अंदर हवा के उपाय",
  },
  tabImpact: {
    en: "Carbon & Alternatives",
    hi: "कार्बन और टिकाऊ विकल्प",
  },

  // Location and live air
  locationHeading: {
    en: "Location & Air Quality",
    hi: "स्थान और वायु गुणवत्ता",
  },
  searchCity: {
    en: "Search City",
    hi: "शहर खोजें",
  },
  cityPlaceholder: {
    en: "e.g. Delhi, Lucknow, Patna, Mumbai…",
    hi: "जैसे दिल्ली, लखनऊ, पटना, मुंबई…",
  },
  searchBtn: {
    en: "Search",
    hi: "खोजें",
  },
  useLocation: {
    en: "Use My Location",
    hi: "मेरी लोकेशन उपयोग करें",
  },
  geoDenied: {
    en: "Location access was denied or timed out. Please enter a city above or use the manual PM2.5 slider.",
    hi: "लोकेशन अनुमति अस्वीकृत या समय समाप्त हुई। कृपया ऊपर शहर खोजें या मैन्युअल PM2.5 स्लाइडर का उपयोग करें।",
  },
  geoLoading: {
    en: "Acquiring GPS coordinates…",
    hi: "GPS निर्देशांक प्राप्त किए जा रहे हैं…",
  },
  airLoading: {
    en: "Fetching live 24h atmospheric model data from Open-Meteo…",
    hi: "Open-Meteo से 24 घंटे का वायुमंडलीय मॉडल डेटा लाया जा रहा है…",
  },
  airError: {
    en: "Unable to retrieve live model air data. Reverting to manual PM2.5 baseline.",
    hi: "लाइव मॉडल वायु डेटा प्राप्त नहीं हो सका। मैन्युअल PM2.5 का उपयोग किया जा रहा है।",
  },
  modelEstimateBadge: {
    en: "Model Estimate (Open-Meteo CAMS, 24h mean)",
    hi: "मॉडल अनुमान (Open-Meteo CAMS, 24 घंटे का औसत)",
  },
  manualFallbackHeading: {
    en: "Manual 24h PM2.5 Input (Offline / Fallback)",
    hi: "मैन्युअल 24h PM2.5 इनपुट (ऑफ़लाइन / विकल्प)",
  },
  aqiLabel: {
    en: "AQI",
    hi: "AQI",
  },
  pm25Label: {
    en: "PM2.5",
    hi: "PM2.5",
  },
  ugm3: {
    en: "µg/m³",
    hi: "µg/m³",
  },

  // AQI Health impact descriptions by band
  healthDescriptions: [
    {
      en: "Minimal impact. Good air quality for outdoor activities.",
      hi: "न्यूनतम असर। बाहरी गतिविधियों के लिए अनुकूल हवा।",
    },
    {
      en: "Minor breathing discomfort to sensitive individuals on prolonged exertion.",
      hi: "संवेदनशील लोगों को लंबे समय तक बाहर रहने पर हल्की सांस की तकलीफ़।",
    },
    {
      en: "Discomfort to children, older adults, and individuals with asthma or heart ailments.",
      hi: "बच्चों, बुजुर्गों और दमा या दिल की बीमारी वाले व्यक्तियों को तकलीफ़।",
    },
    {
      en: "Breathing discomfort to most people on prolonged exposure. Avoid strenuous outdoor workouts.",
      hi: "अधिकतर लोगों को लंबे समय तक रहने पर सांस में तकलीफ़। बाहर भारी कसरत से बचें।",
    },
    {
      en: "Severe risk of respiratory illness on prolonged exposure. Vulnerable groups must stay indoors.",
      hi: "लंबे समय तक रहने पर सांस की बीमारी का गंभीर जोखिम। संवेदनशील लोग घर में रहें।",
    },
    {
      en: "Health emergency! Affects even healthy adults; severe impacts on vulnerable groups.",
      hi: "स्वास्थ्य आपातकाल! स्वस्थ वयस्कों पर भी गंभीर असर; मरीजों के लिए अत्यंत जोखिम।",
    },
  ],

  // Low emission daily routines
  routineHeading: {
    en: "Low-Emission Daily Routine",
    hi: "कम-उत्सर्जन दैनिक दिनचर्या",
  },
  routineItems: [
    {
      title_en: "Take the metro, city bus, or carpool for daily commutes",
      title_hi: "दैनिक यात्रा के लिए मेट्रो, सिटी बस या कारपूल अपनाएं",
      why_en: "Consolidating trips directly reduces street-level tailpipe PM2.5, NOx, and volatile organic compounds in your neighborhood.",
      why_hi: "सामूहिक यात्रा से आपके पड़ोस की सड़क पर वाहनों से निकलने वाला PM2.5, NOx और जहरीला धुआं तुरंत घटता है।",
    },
    {
      title_en: "Practice strict anti-idling at traffic lights and gates",
      title_hi: "ट्रैफिक सिग्नल और फाटकों पर इंजन बंद रखें (आइडल-स्टॉप)",
      why_en: "An idling engine burns fuel with zero movement, releasing concentrated particulate matter at breathing height.",
      why_hi: "इंजन चालू रखने से बिना चले ईंधन जलता है और सांस लेने की ऊंचाई पर सघन बारीक धूल पैदा होती है।",
    },
    {
      title_en: "Report open leaf and garbage burning to local authorities/RWA",
      title_hi: "कचरा और सूखे पत्ते जलाने की शिकायत तुरंत RWA या नगर निगम को करें",
      why_en: "Biomass and plastic burning emit carcinogenic polycyclic hydrocarbons and ultrafine soot trapped close to the ground in winter inversion.",
      why_hi: "कचरा व बायोमास जलने से जहरीले हाइड्रोकार्बन और कालिख निकलती है जो सर्दियों की हवा में जमीन के पास जम जाती है।",
    },
  ],

  // GenAI explanation
  summaryHeading: {
    en: "AI Air Quality Guide",
    hi: "AI वायु गुणवत्ता सहायक",
  },
  summaryLoading: {
    en: "Generating grounded air quality explanation…",
    hi: "तथ्यों पर आधारित वायु विवरण तैयार हो रहा है…",
  },
  summaryPlaceholder: {
    en: "Ask a question about today's air (e.g. 'Can I go jogging?'):",
    hi: "आज की हवा के बारे में सवाल पूछें (जैसे 'क्या मैं दौड़ने जा सकता हूँ?'):",
  },
  askBtn: {
    en: "Ask",
    hi: "पूछें",
  },
  sourceGemini: {
    en: "Generated by Gemini Flash (strictly grounded on computed data, not medical advice)",
    hi: "Gemini Flash द्वारा निर्मित (गणितीय तथ्यों पर आधारित, चिकित्सकीय सलाह नहीं)",
  },
  sourceRules: {
    en: "Derived from deterministic rule engine (safe offline fallback)",
    hi: "नियम-आधारित इंजन द्वारा सुरक्षित रूप से तैयार",
  },

  // Family section
  familyHeading: {
    en: "Personalized Family Protection",
    hi: "परिवार के लिए व्यक्तिगत सुरक्षा उपाय",
  },
  addMemberBtn: {
    en: "+ Add Family Member",
    hi: "+ परिवार का सदस्य जोड़ें",
  },
  memberName: {
    en: "Name / Relation",
    hi: "नाम / संबंध",
  },
  memberAge: {
    en: "Age (years)",
    hi: "उम्र (वर्ष)",
  },
  memberHours: {
    en: "Hours Outdoors / Day",
    hi: "प्रतिदिन बाहर बिताए घंटे",
  },
  memberCond: {
    en: "Asthma / COPD / Heart Condition",
    hi: "दमा / सांस / दिल की बीमारी",
  },
  memberPreg: {
    en: "Pregnant",
    hi: "गर्भवती",
  },
  removeBtn: {
    en: "Remove",
    hi: "हटाएं",
  },
  riskScoreLabel: {
    en: "Vulnerability Score",
    hi: "जोखिम स्कोर",
  },
  whyLabel: {
    en: "Why?",
    hi: "क्यों?",
  },
  planLoading: {
    en: "Calculating customized family precautions…",
    hi: "परिवार के लिए सुरक्षा सावधानियों की गणना जारी है…",
  },
  planError: {
    en: "Failed to connect to plan engine.",
    hi: "प्लान इंजन से संपर्क नहीं हो सका।",
  },

  // Indoor hacks
  indoorHeading: {
    en: "Indoor Air Quality Hacks",
    hi: "घर के अंदर हवा साफ़ रखने के उपाय",
  },
  windowsVerdict: {
    en: "Window Ventilation Verdict",
    hi: "खिड़कियां खोलने का निर्णय",
  },
  purifierHeading: {
    en: "Air Purifier Sizing (CADR Calculator)",
    hi: "एयर प्यूरीफ़ायर का आकार (CADR कैलकुलेटर)",
  },
  roomArea: {
    en: "Room Floor Area (m²)",
    hi: "कमरे का क्षेत्रफल (m²)",
  },
  roomHeight: {
    en: "Ceiling Height (m)",
    hi: "छत की ऊंचाई (m)",
  },
  cadrReq: {
    en: "Recommended Clean Air Delivery Rate (CADR):",
    hi: "अनुशंसित क्लीन एयर डिलीवरी रेट (CADR):",
  },
  cadrFormulaNote: {
    en: "Engineering Standard: Area × Height × 5 Air Changes per Hour (ACH) for severe smog filtration.",
    hi: "मानक सूत्र: क्षेत्रफल × ऊंचाई × 5 बार हवा बदलाव प्रति घंटा (ACH) गंभीर स्मॉग के लिए।",
  },
  diyBoxFanHeading: {
    en: "Affordable Hack: The DIY Box-Fan Filter (~₹2,000)",
    hi: "किफ़ायती उपाय: DIY बॉक्स-फ़ैन फ़िल्टर (~₹2,000)",
  },
  diyBoxFanBody: {
    en: "If commercial air purifiers (₹10,000–₹25,000) are out of budget: secure a MERV-13 or true HEPA filter against the intake side of a standard box fan with duct tape. This delivers 250–400 m³/h CADR at ~80% lower cost.",
    hi: "यदि महंगे एयर प्यूरीफ़ायर (₹10,000–₹25,000) बजट से बाहर हैं: एक सामान्य बॉक्स फ़ैन के पीछे डक्ट टेप से MERV-13 या HEPA फ़िल्टर चिपकाएं। यह ~80% कम लागत में 250–400 m³/h CADR साफ़ हवा देता है।",
  },
  cleaningHackHeading: {
    en: "Cleaning Hack: Wet Mopping Only",
    hi: "सफ़ाई का नियम: सिर्फ़ गीला पोछा लगाएं",
  },
  cleaningHackBody: {
    en: "Never dry sweep indoors during smog days; brooms re-suspend settled PM2.5 back into breathing zones. Always use a damp mop or vacuum with a sealed HEPA exhaust.",
    hi: "स्मॉग के दिनों में झाड़ू कभी न लगाएं; झाड़ू से जमीन पर बैठी बारीक धूल वापस हवा में उड़ जाती है। हमेशा गीले पोंछे या HEPA वैक्यूम का प्रयोग करें।",
  },
  windowOptions: [
    {
      title_en: "Keep windows open for active cross-ventilation",
      title_hi: "खिड़कियां खोलकर ताज़ा हवा आने दें",
      why_en: "Outdoor air is clean. Ventilating prevents indoor CO2 buildup, moisture, and VOC accumulation.",
      why_hi: "बाहरी हवा स्वच्छ है। हवा बदलने से घर में CO2 और सीलन एकत्र नहीं होती।",
    },
    {
      title_en: "Air out briefly during warmest afternoon hours, then seal tightly",
      title_hi: "दोपहर के सबसे साफ़ समय 15–20 मिनट खिड़की खोलें, फिर बंद कर दें",
      why_en: "Smog is concentrated in early mornings and nights due to thermal inversion. Midday sun lifts the boundary layer.",
      why_hi: "सुबह और रात में स्मॉग नीचे जमा रहता है। दोपहर में धूप से प्रदूषण थोड़ा ऊपर उठता है।",
    },
    {
      title_en: "Keep all windows & exterior doors sealed; use draft stoppers",
      title_hi: "खिड़कियां और दरवाज़े पूरी तरह बंद रखें; दरारों में टेप या कपड़ा लगाएं",
      why_en: "Outdoor particulate concentration is toxic. Infiltration through window cracks spikes indoor PM2.5 within minutes.",
      why_hi: "बाहर की हवा अत्यंत हानिकारक है। खिड़कियों की दरारों से जहरीला धुआं मिनटों में अंदर पहुंच जाता है।",
    },
  ],

  // Impact & sustainable alternatives
  impactHeading: {
    en: "Sustainable Alternatives & CO₂ Impact",
    hi: "टिकाऊ विकल्प और सीधा कार्बन असर",
  },
  travelMode: {
    en: "Daily Commute Mode",
    hi: "दैनिक आवागमन का साधन",
  },
  oneWayKm: {
    en: "One-Way Distance (km)",
    hi: "एक तरफ की दूरी (km)",
  },
  daysPerWeek: {
    en: "Commute Days / Week",
    hi: "सप्ताह में आने-जाने के दिन",
  },
  annualCo2: {
    en: "Your Annual Transport Footprint:",
    hi: "आपका वार्षिक परिवहन उत्सर्जन:",
  },
  annualSavingsVsCar: {
    en: "Net Annual CO₂ Prevented vs. Petrol Car:",
    hi: "पेट्रोल कार की तुलना में शुद्ध वार्षिक बचत:",
  },
  kgCo2Year: {
    en: "kg CO₂ / year",
    hi: "kg CO₂ / वर्ष",
  },
  impactAssumptions: {
    en: "Transparent Assumptions: Petrol car ~0.154 kg CO₂/km (15 km/L); 2-wheeler scooter ~0.051 kg CO₂/km (45 km/L); City bus ~0.080 kg CO₂/passenger-km; Electric Metro ~0.030 kg CO₂/passenger-km (grid-adjusted); Cycle/Walk 0. Calculated over 52 weeks round-trip. Sources: India MoEFCC & IPCC AR6 emission baselines.",
    hi: "स्पष्ट मान्यताएं: पेट्रोल कार ~0.154 kg CO₂/km; स्कूटर/बाइक ~0.051 kg CO₂/km; सिटी बस ~0.080 kg/यात्री-km; मेट्रो ~0.030 kg/यात्री-km; साइकिल/पैदल 0। 52 सप्ताह, दोनों तरफ की यात्रा। स्रोत: भारत MoEFCC और IPCC AR6 मानक।",
  },
};

/**
 * Translation accessor.
 * @param {{ en: string, hi: string } | string} obj
 * @param {"en"|"hi"} lang
 * @returns {string}
 */
export function t(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return lang === "hi" && obj.hi ? obj.hi : obj.en || "";
}
