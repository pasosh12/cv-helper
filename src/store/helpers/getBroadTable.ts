import { SectionsNames } from "@/enums/sectionsNames";
import { ITechnologiesTableData } from "@/types/storeTypes";
import { broadSectionsOrder } from "../constants/sectionsOrder";

/**
 * Re-groups an already computed technologies table into the broad categories
 * used by the summary field (e.g. Frontend, Backend, AI tools). Any section
 * that isn't one of those broad categories collapses into Frontend, matching
 * the fallback behavior of getSummary.
 */
export const getBroadTable = (table: ITechnologiesTableData): ITechnologiesTableData => {
  const broadTable: ITechnologiesTableData = {};

  Object.entries(table).forEach(([section, technologies]) => {
    const broadSection = broadSectionsOrder.includes(section as SectionsNames)
      ? section
      : SectionsNames.Frontend;

    broadTable[broadSection] = [...(broadTable[broadSection] ?? []), ...technologies];
  });

  const sortedEntries = Object.entries(broadTable).sort(
    ([a], [b]) =>
      broadSectionsOrder.indexOf(a as SectionsNames) -
      broadSectionsOrder.indexOf(b as SectionsNames),
  );

  return Object.fromEntries(sortedEntries);
};
