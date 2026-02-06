import { describe, expect, it } from "vitest";
import { isAllowedEmail, normalizeEmail } from "../lib/validations";

describe("Email Normalization", () => {
    describe("normalizeEmail", () => {
        it("should trim whitespace and convert to lowercase", () => {
            expect(normalizeEmail(" BARAKAT2647@Gmail.com ")).toBe(
                "barakat2647@gmail.com",
            );
        });

        it("should handle already normalized emails", () => {
            expect(normalizeEmail("barakat2647@gmail.com")).toBe(
                "barakat2647@gmail.com",
            );
        });

        it("should return empty string for null", () => {
            expect(normalizeEmail(null)).toBe("");
        });

        it("should return empty string for undefined", () => {
            expect(normalizeEmail(undefined)).toBe("");
        });

        it("should handle emails with only whitespace differences", () => {
            expect(normalizeEmail("  barakat2647@gmail.com  ")).toBe(
                "barakat2647@gmail.com",
            );
        });
    });

    describe("isAllowedEmail", () => {
        it("should return true for exact match", () => {
            expect(isAllowedEmail("barakat2647@gmail.com")).toBe(true);
        });

        it("should return true for uppercase email", () => {
            expect(isAllowedEmail("BARAKAT2647@gmail.com")).toBe(true);
        });

        it("should return true for mixed case email", () => {
            expect(isAllowedEmail("Barakat2647@GMAIL.COM")).toBe(true);
        });

        it("should return true for email with leading/trailing whitespace", () => {
            expect(isAllowedEmail(" barakat2647@gmail.com ")).toBe(true);
        });

        it("should return true for uppercase email with whitespace", () => {
            expect(isAllowedEmail("  BARAKAT2647@GMAIL.COM  ")).toBe(true);
        });

        it("should return false for non-allowed email", () => {
            expect(isAllowedEmail("other@example.com")).toBe(false);
        });

        it("should return false for similar but different email", () => {
            expect(isAllowedEmail("barakat2648@gmail.com")).toBe(false);
        });

        it("should return false for null", () => {
            expect(isAllowedEmail(null)).toBe(false);
        });

        it("should return false for undefined", () => {
            expect(isAllowedEmail(undefined)).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(isAllowedEmail("")).toBe(false);
        });
    });
});
