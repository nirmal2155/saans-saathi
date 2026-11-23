import { describe, it, expect } from "vitest";
import { T, t } from "../../public/js/i18n.js";

describe("i18n.js — Key Completeness & Translation Engine", () => {
  it("translates objects based on language code", () => {
    const sample = { en: "Hello", hi: "नमस्ते" };
    expect(t(sample, "en")).toBe("Hello");
    expect(t(sample, "hi")).toBe("नमस्ते");
  });

  it("falls back to English if Hindi text is missing or blank", () => {
    const partial = { en: "Fallback" };
    expect(t(partial, "hi")).toBe("Fallback");
  });

  it("returns raw string if a string was passed", () => {
    expect(t("Plain Text", "hi")).toBe("Plain Text");
  });

  it("returns empty string on null or undefined input", () => {
    expect(t(null, "en")).toBe("");
    expect(t(undefined, "hi")).toBe("");
  });

  it("verifies 100% key completeness across all UI string objects", () => {
    function verifyNode(node, path) {
      if (!node || typeof node !== "object") return;

      if ("en" in node || "hi" in node) {
        expect(typeof node.en, `Missing 'en' at ${path}`).toBe("string");
        expect(node.en.trim().length, `Empty 'en' string at ${path}`).toBeGreaterThan(0);

        expect(typeof node.hi, `Missing 'hi' at ${path}`).toBe("string");
        expect(node.hi.trim().length, `Empty 'hi' string at ${path}`).toBeGreaterThan(0);
        return;
      }

      if (Array.isArray(node)) {
        node.forEach((item, idx) => {
          verifyNode(item, `${path}[${idx}]`);
        });
        return;
      }

      for (const [key, val] of Object.entries(node)) {
        verifyNode(val, `${path}.${key}`);
      }
    }

    verifyNode(T, "T");
  });

  it("verifies all structured arrays have complete bilingual pairs", () => {
    // Health descriptions (6 bands)
    expect(T.healthDescriptions.length).toBe(6);
    T.healthDescriptions.forEach((desc, idx) => {
      expect(desc.en.length, `Health desc en band ${idx}`).toBeGreaterThan(10);
      expect(desc.hi.length, `Health desc hi band ${idx}`).toBeGreaterThan(10);
    });

    // Routine items
    expect(T.routineItems.length).toBeGreaterThanOrEqual(3);
    T.routineItems.forEach((r, idx) => {
      expect(r.title_en, `Routine title_en ${idx}`).toBeTruthy();
      expect(r.title_hi, `Routine title_hi ${idx}`).toBeTruthy();
      expect(r.why_en, `Routine why_en ${idx}`).toBeTruthy();
      expect(r.why_hi, `Routine why_hi ${idx}`).toBeTruthy();
    });

    // Window options
    expect(T.windowOptions.length).toBe(3);
    T.windowOptions.forEach((w, idx) => {
      expect(w.title_en, `Window title_en ${idx}`).toBeTruthy();
      expect(w.title_hi, `Window title_hi ${idx}`).toBeTruthy();
      expect(w.why_en, `Window why_en ${idx}`).toBeTruthy();
      expect(w.why_hi, `Window why_hi ${idx}`).toBeTruthy();
    });
  });
});
