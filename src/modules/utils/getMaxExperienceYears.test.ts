import { describe, expect, it } from "vitest";
import { ITechnologiesTableData } from "@/types/storeTypes";
import { getMaxExperienceYears } from "./getMaxExperienceYears";

describe("getMaxExperienceYears", () => {
  it("returns undefined for an empty table (no CV imported yet)", () => {
    expect(getMaxExperienceYears({})).toBeUndefined();
  });

  it("returns the highest rounded year value across every section", () => {
    const table: ITechnologiesTableData = {
      Frontend: [
        { name: "HTML", range: 84, lastUsed: "2024" }, // 7 years
        { name: "React", range: 36, lastUsed: "2024" }, // 3 years
      ],
      Backend: [{ name: "Node.js", range: 60, lastUsed: "2023" }], // 5 years
    };

    expect(getMaxExperienceYears(table)).toBe(7);
  });
});
