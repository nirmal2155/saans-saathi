import { describe, it, expect, beforeEach } from "vitest";
import {
  clamp,
  validateState,
  MODES,
  INITIAL_STATE,
  getState,
  setState,
  setMember,
  addMember,
  removeMember,
  persistState,
  loadStoredState,
  STORAGE_KEY,
} from "../../public/js/state.js";

describe("state.js — Pure Logic & State Management", () => {
  beforeEach(() => {
    // Reset state before each test
    setState({ ...INITIAL_STATE, fam: [...INITIAL_STATE.fam] }, null);
  });

  describe("clamp() helper", () => {
    it("clamps values within [min, max]", () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it("handles boundary values correctly", () => {
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });

    it("returns fallback on NaN or invalid inputs", () => {
      expect(clamp("invalid", 0, 100, 25)).toBe(25);
      expect(clamp(NaN, 0, 100, 10)).toBe(10);
      expect(clamp(undefined, 0, 100, 5)).toBe(5);
    });
  });

  describe("validateState()", () => {
    it("returns default state for null or invalid inputs", () => {
      const valid = validateState(null);
      expect(valid.lang).toBe("en");
      expect(valid.tab).toBe(0);
      expect(valid.pm).toBe(150);
      expect(valid.fam.length).toBe(2);
    });

    it("clamps out-of-bounds numbers in loaded state", () => {
      const dirty = {
        lang: "hi",
        tab: 99,
        pm: 9999,
        area: 0,
        ht: 10,
        km: -5,
        days: 12,
        mode: "unknown_mode",
      };
      const clean = validateState(dirty);
      expect(clean.lang).toBe("hi");
      expect(clean.tab).toBe(3); // max 3
      expect(clean.pm).toBe(500); // max 500
      expect(clean.area).toBe(1); // min 1
      expect(clean.ht).toBe(6); // max 6
      expect(clean.km).toBe(0); // min 0
      expect(clean.days).toBe(7); // max 7
      expect(clean.mode).toBe("car"); // fallback to car
    });

    it("clears transient API response fields", () => {
      const dirty = {
        airData: { aqi: 300 },
        planData: { members: [] },
        summaryData: { text: "smog" },
      };
      const clean = validateState(dirty);
      expect(clean.airData).toBeNull();
      expect(clean.planData).toBeNull();
      expect(clean.summaryData).toBeNull();
    });
  });

  describe("Family Member CRUD", () => {
    it("adds a member up to the maximum limit of 8", () => {
      const mockStorage = {
        data: {},
        setItem(k, v) { this.data[k] = v; },
        getItem(k) { return this.data[k]; },
      };

      // Initial state has 2 members
      expect(getState().fam.length).toBe(2);

      // Add 6 more to reach 8
      for (let i = 0; i < 6; i++) {
        const added = addMember(mockStorage);
        expect(added).toBe(true);
      }
      expect(getState().fam.length).toBe(8);

      // 9th addition must be rejected
      const overLimit = addMember(mockStorage);
      expect(overLimit).toBe(false);
      expect(getState().fam.length).toBe(8);
    });

    it("removes a member by index", () => {
      const mockStorage = {
        data: {},
        setItem(k, v) { this.data[k] = v; },
        getItem(k) { return this.data[k]; },
      };

      setMember(0, { name: "Elderly Parent" }, mockStorage);
      expect(getState().fam[0].name).toBe("Elderly Parent");

      removeMember(0, mockStorage);
      expect(getState().fam.length).toBe(1);
      expect(getState().fam[0].name).not.toBe("Elderly Parent");
    });

    it("updates individual member attributes", () => {
      const mockStorage = {
        data: {},
        setItem(k, v) { this.data[k] = v; },
        getItem(k) { return this.data[k]; },
      };

      setMember(0, { name: "Meera", age: 34, pregnant: true }, mockStorage);
      const member = getState().fam[0];
      expect(member.name).toBe("Meera");
      expect(member.age).toBe(34);
      expect(member.pregnant).toBe(true);
      expect(member.has_condition).toBe(false);
    });
  });

  describe("Travel Modes & Factors", () => {
    it("has exact emission factors aligned with IPCC / MoEFCC", () => {
      expect(MODES.car.factor).toBe(0.154);
      expect(MODES.bike.factor).toBe(0.051);
      expect(MODES.bus.factor).toBe(0.080);
      expect(MODES.metro.factor).toBe(0.030);
      expect(MODES.cycle.factor).toBe(0.000);
    });

    it("provides bilingual labels for every mode", () => {
      for (const [key, mode] of Object.entries(MODES)) {
        expect(mode.en).toBeTruthy();
        expect(mode.hi).toBeTruthy();
      }
    });
  });

  describe("Storage Persistence", () => {
    it("saves and loads state cleanly from localStorage", () => {
      const mockStorage = {
        store: {},
        setItem(k, v) { this.store[k] = String(v); },
        getItem(k) { return this.store[k] || null; },
      };

      setState({ lang: "hi", pm: 240, mode: "metro" }, mockStorage);
      const storedJson = mockStorage.getItem(STORAGE_KEY);
      expect(storedJson).toContain('"lang":"hi"');
      expect(storedJson).toContain('"pm":240');
      expect(storedJson).toContain('"mode":"metro"');

      // Re-load
      const loaded = loadStoredState(mockStorage);
      expect(loaded.lang).toBe("hi");
      expect(loaded.pm).toBe(240);
      expect(loaded.mode).toBe("metro");
    });
  });
});
