import { describe, it, expect } from "vitest";
import { AQI_BANDS, getBandIndexByPm, estimateAqiFromPm, getBandIndexByCategory } from "../js/ui.js";

/**
 * Calculates WCAG 2.2 relative luminance of an sRGB hex color.
 * Standard: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes contrast ratio between two hex colors.
 * Standard: https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG 2.2 AA Accessibility & Visual Verification", () => {
  describe("AQI Color Palette Contrast Audit (Requirement: >= 4.5:1)", () => {
    it("ensures every AQI band background color meets or exceeds 4.5:1 contrast against white text", () => {
      AQI_BANDS.forEach(band => {
        const contrast = getContrastRatio(band.bg, "#ffffff");
        expect(
          contrast,
          `Band '${band.en}' (${band.bg}) failed WCAG 2.2 AA contrast: got ${contrast.toFixed(2)}:1 (minimum 4.5:1)`
        ).toBeGreaterThanOrEqual(4.5);
      });
    });

    it("logs exact contrast ratios for audit verification", () => {
      const summary = AQI_BANDS.map(b => ({
        band: b.en,
        bg: b.bg,
        contrast: `${getContrastRatio(b.bg, "#ffffff").toFixed(2)}:1`,
      }));

      // Ensure all 6 bands are covered
      expect(summary.length).toBe(6);
      expect(summary.every(s => parseFloat(s.contrast) >= 4.5)).toBe(true);
    });
  });

  describe("CPCB NAQI Breakpoint Consistency", () => {
    it("maps standard CPCB PM2.5 breakpoints to exact bands", () => {
      expect(getBandIndexByPm(0)).toBe(0); // Good (0-30)
      expect(getBandIndexByPm(30)).toBe(0);
      expect(getBandIndexByPm(31)).toBe(1); // Satisfactory (30-60)
      expect(getBandIndexByPm(60)).toBe(1);
      expect(getBandIndexByPm(61)).toBe(2); // Moderate (60-90)
      expect(getBandIndexByPm(90)).toBe(2);
      expect(getBandIndexByPm(91)).toBe(3); // Poor (90-120)
      expect(getBandIndexByPm(120)).toBe(3);
      expect(getBandIndexByPm(121)).toBe(4); // Very Poor (120-250)
      expect(getBandIndexByPm(250)).toBe(4);
      expect(getBandIndexByPm(251)).toBe(5); // Severe (250-500)
      expect(getBandIndexByPm(500)).toBe(5);
    });

    it("interpolates AQI linear sub-indices correctly", () => {
      expect(estimateAqiFromPm(0)).toBe(0);
      expect(estimateAqiFromPm(30)).toBe(50);
      expect(estimateAqiFromPm(60)).toBe(100);
      expect(estimateAqiFromPm(90)).toBe(200);
      expect(estimateAqiFromPm(120)).toBe(300);
      expect(estimateAqiFromPm(250)).toBe(400);
      expect(estimateAqiFromPm(500)).toBe(500);
    });

    it("retrieves band index by category name case-insensitively", () => {
      expect(getBandIndexByCategory("good")).toBe(0);
      expect(getBandIndexByCategory("Satisfactory")).toBe(1);
      expect(getBandIndexByCategory("MODERATE")).toBe(2);
      expect(getBandIndexByCategory("Poor")).toBe(3);
      expect(getBandIndexByCategory("Very Poor")).toBe(4);
      expect(getBandIndexByCategory("Severe")).toBe(5);
      expect(getBandIndexByCategory("unknown")).toBe(0);
    });
  });
});
