import { normalizedNames } from "./constants";

export const isNormalizedName = (
  sectionName: keyof typeof normalizedNames,
  comparisonValue: string,
) => normalizedNames[sectionName].includes(comparisonValue);
