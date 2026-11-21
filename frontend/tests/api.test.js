import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAir, geocodeCity, fetchPlan, fetchSummary } from "../js/api.js";

describe("api.js — Network Client & Resilience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("geocodeCity()", () => {
    it("returns empty array immediately for queries under 2 characters without network call", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const emptyRes = await geocodeCity(" ");
      const oneChar = await geocodeCity("D");
      expect(emptyRes).toEqual([]);
      expect(oneChar).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("parses and returns results on successful 200 response", async () => {
      const mockResults = [
        { name: "Delhi", latitude: 28.65, longitude: 77.23, country: "India" },
      ];
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockResults }),
      });

      const res = await geocodeCity("Delhi");
      expect(res).toEqual(mockResults);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/geocode?q=Delhi"),
        expect.any(Object)
      );
    });

    it("throws a descriptive error on 422 or 502 status", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ detail: "Geocoding service unavailable" }),
      });

      await expect(geocodeCity("BrokenCity")).rejects.toThrow(
        "Geocoding service unavailable"
      );
    });
  });

  describe("fetchAir()", () => {
    it("fetches air quality data with coordinates encoded in query params", async () => {
      const mockAir = {
        pm25: 124.5,
        aqi: 304,
        category: "Very Poor",
        source: "Open-Meteo CAMS model estimate",
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockAir,
      });

      const res = await fetchAir(28.61, 77.21);
      expect(res).toEqual(mockAir);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/air?lat=28.61&lon=77.21"),
        expect.any(Object)
      );
    });

    it("extracts server detail on error response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "Invalid coordinates" }),
      });

      await expect(fetchAir(999, 999)).rejects.toThrow("Invalid coordinates");
    });
  });

  describe("fetchPlan()", () => {
    it("posts PM2.5 and family members and returns action plan", async () => {
      const mockPlan = {
        aqi: 220,
        category: "Poor",
        members: [
          {
            name: "Child",
            risk: 4,
            actions: [{ code: "n95", en: "Wear N95", hi: "N95 पहनें" }],
          },
        ],
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockPlan,
      });

      const members = [{ name: "Child", age: 6, has_condition: false, pregnant: false, hours_outside: 2 }];
      const res = await fetchPlan(95, members);
      expect(res).toEqual(mockPlan);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/plan",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pm25: 95, members }),
        })
      );
    });

    it("handles server failure gracefully", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Calculation engine failure" }),
      });

      await expect(fetchPlan(100, [])).rejects.toThrow("Calculation engine failure");
    });
  });

  describe("fetchSummary()", () => {
    it("requests grounded summary in English and Hindi", async () => {
      const mockSummary = { text: "AQI is 150. Sensitive individuals should limit outdoor time.", source: "gemini" };
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      });

      const res = await fetchSummary(75, "Is it safe to exercise?", "en");
      expect(res).toEqual(mockSummary);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/summary",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            pm25: 75,
            question: "Is it safe to exercise?",
            lang: "en",
          }),
        })
      );
    });

    it("truncates user question to 300 characters to prevent payload bloat", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ text: "ok", source: "rules" }),
      });

      const hugeQuestion = "a".repeat(500);
      await fetchSummary(50, hugeQuestion, "hi");

      const callBody = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1].body);
      expect(callBody.question.length).toBe(300);
    });
  });
});
