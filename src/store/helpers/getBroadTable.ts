import { SectionsNames } from "@/enums/sectionsNames";
import { ITechnologiesTableData } from "@/types/storeTypes";
import { broadSectionsOrder } from "../constants/sectionsOrder";
import { getBroadSection } from "./getBroadSection";

/**
 * Re-groups an already computed technologies table into the broad categories
 * used by the summary field (e.g. Frontend, Backend, AI tools) - each
 * technology goes where getBroadSection puts it, same as in getSummary.
 * Technologies outside every broad group are dropped, except the "Not found"
 * ones, which stay in their own section at the end.
 */
export const getBroadTable = (table: ITechnologiesTableData): ITechnologiesTableData => {
  const broadTable: ITechnologiesTableData = {};

  Object.entries(table).forEach(([section, technologies]) => {
    technologies.forEach((technology) => {
      const broadSection =
        section === SectionsNames.NotFound
          ? SectionsNames.NotFound
          : getBroadSection(section, technology.name);
      if (!broadSection) return;

      broadTable[broadSection] = [...(broadTable[broadSection] ?? []), technology];
    });
  });

  const order = [...broadSectionsOrder, SectionsNames.NotFound];
  const sortedEntries = Object.entries(broadTable).sort(
    ([a], [b]) => order.indexOf(a as SectionsNames) - order.indexOf(b as SectionsNames),
  );

  return Object.fromEntries(sortedEntries);
};
