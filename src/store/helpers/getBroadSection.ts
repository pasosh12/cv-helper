import { SectionsNames } from "@/enums/sectionsNames";
import { normalizeString } from "@/modules/utils/normalizeString";
import { broadSectionsOrder } from "../constants/sectionsOrder";
import { broadSectionsBySheetSection, broadSectionsByTechnology } from "../constants/broadSections";

/**
 * Picks the broad summary group (e.g. Frontend, Message Brokers, DevOps) for a
 * technology from its sheet section. Known technologies go to their own group
 * whatever the sheet says, some sheet sections are merged under another name
 * and anything else that isn't a broad group gets null - it stays out of the
 * summary.
 */
export const getBroadSection = (sheetSection: string, technology: string): SectionsNames | null => {
  const technologyName = technology.replace(/\([^()]*\)/g, "");
  const byTechnology = broadSectionsByTechnology[normalizeString(technologyName)];
  if (byTechnology) return byTechnology;

  const bySection = broadSectionsBySheetSection[sheetSection];
  if (bySection) return bySection;

  return broadSectionsOrder.includes(sheetSection as SectionsNames)
    ? (sheetSection as SectionsNames)
    : null;
};
