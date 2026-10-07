import { ITechnologiesTableData } from "@/types/storeTypes";
import { convertMonthsToYears } from "./convertMonthsToYears";

/**
 * Highest experience, in years, across every technology in the professional
 * skills table - e.g. HTML/JavaScript/TypeScript usually come out on top,
 * since they tend to be used across the most projects. Returns undefined
 * when the table is empty (no CV imported yet).
 */
export const getMaxExperienceYears = (table: ITechnologiesTableData): number | undefined => {
  let maxYears: number | undefined;

  Object.values(table).forEach((technologies) => {
    technologies.forEach((technology) => {
      const years = convertMonthsToYears(technology.range);
      if (maxYears === undefined || years > maxYears) {
        maxYears = years;
      }
    });
  });

  return maxYears;
};
