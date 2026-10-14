import { describe, expect, it } from "vitest";
import { validateDisplayName, validateUsername } from "./validation";

describe("Identity Validation Rules (validateDisplayName & validateUsername)", () => {
  describe("validateDisplayName - Tech Reservation Rule", () => {
    it("rejects 'tech' as display name in any case variation", () => {
      expect(validateDisplayName("tech").isValid).toBe(false);
      expect(validateDisplayName("tech").error).toContain("reserved");

      expect(validateDisplayName("Tech").isValid).toBe(false);
      expect(validateDisplayName("Tech").error).toContain("reserved");

      expect(validateDisplayName("TECH").isValid).toBe(false);
      expect(validateDisplayName("TECH").error).toContain("reserved");
    });

    it("rejects names containing 'tech' as a standalone word or platform desk", () => {
      expect(validateDisplayName("Tech Desk").isValid).toBe(false);
      expect(validateDisplayName("CampusLoop Tech").isValid).toBe(false);
      expect(validateDisplayName("Official Tech").isValid).toBe(false);
      expect(validateDisplayName("loop_tech").isValid).toBe(false);
    });

    it("rejects other reserved platform names", () => {
      expect(validateDisplayName("Admin").isValid).toBe(false);
      expect(validateDisplayName("Support").isValid).toBe(false);
      expect(validateDisplayName("CampusLoop").isValid).toBe(false);
    });

    it("accepts valid student human names", () => {
      expect(validateDisplayName("Aarav Sharma").isValid).toBe(true);
      expect(validateDisplayName("Priya Patel").isValid).toBe(true);
      expect(validateDisplayName("Kunal Kashyap").isValid).toBe(true);
      expect(validateDisplayName("Sarah O'Connor").isValid).toBe(true);
      expect(validateDisplayName("Mary-Jane Watson").isValid).toBe(true);
    });

    it("enforces length and formatting constraints", () => {
      expect(validateDisplayName("").isValid).toBe(false);
      expect(validateDisplayName("A").isValid).toBe(false);
      expect(validateDisplayName("12345").isValid).toBe(false);
      expect(validateDisplayName("A".repeat(55)).isValid).toBe(false);
    });
  });

  describe("validateUsername - Tech Reservation Rule", () => {
    it("rejects 'tech' as a username or handle", () => {
      expect(validateUsername("tech").isValid).toBe(false);
      expect(validateUsername("tech").error).toContain("reserved");

      expect(validateUsername("loop_tech").isValid).toBe(false);
      expect(validateUsername("campusloop_tech").isValid).toBe(false);
      expect(validateUsername("tech_desk").isValid).toBe(false);
    });

    it("accepts legitimate student campus handles", () => {
      expect(validateUsername("aarav_sharma").isValid).toBe(true);
      expect(validateUsername("kunal8024").isValid).toBe(true);
      expect(validateUsername("priya_p").isValid).toBe(true);
    });

    it("enforces length and character constraints", () => {
      expect(validateUsername("").isValid).toBe(false);
      expect(validateUsername("ab").isValid).toBe(false);
      expect(validateUsername("user name with spaces").isValid).toBe(false);
      expect(validateUsername("user@handle!").isValid).toBe(false);
      expect(validateUsername("a".repeat(35)).isValid).toBe(false);
    });
  });
});
