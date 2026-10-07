import { describe, expect, it } from "vitest";
import { levenshteinDistance } from "./levenshteinDistance";

describe("levenshteinDistance", () => {
  it("is 0 for identical strings", () => {
    expect(levenshteinDistance("bulynka", "bulynka")).toBe(0);
  });

  it("counts a single substitution as distance 1", () => {
    expect(levenshteinDistance("kot", "kit")).toBe(1);
  });

  it("counts the real-world 'mihnevich' / 'mikhevich' typo as distance 2", () => {
    expect(levenshteinDistance("mihnevich", "mikhevich")).toBe(2);
  });

  it("equals the length of the other string when one side is empty", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
    expect(levenshteinDistance("", "")).toBe(0);
  });
});
