import { SectionsNames } from "@/enums/sectionsNames";
import { normalizeString } from "@/modules/utils/normalizeString";
import { IProject, ITechnologiesMap } from "@/types/storeTypes";

type Map = Partial<Record<SectionsNames, string[]>>;

const getTechName = (tech: string) => {
  const openParenIndex = tech.indexOf("(");
  if (openParenIndex !== -1 && tech.endsWith(")")) {
    return tech.substring(0, openParenIndex).trim();
  }
  return tech;
};

function findDuplicates(arr: string[]) {
  const map = new Map<string, Set<string>>();

  arr.forEach((elem) => {
    const name = getTechName(elem);
    const normalizedElem = normalizeString(name);

    if (!map.has(normalizedElem)) {
      map.set(normalizedElem, new Set());
    }
    map.get(normalizedElem)!.add(name);
  });

  const duplicates: string[] = [];
  map.forEach((names) => {
    if (names.size > 1) {
      duplicates.push(...Array.from(names));
    }
  });

  return duplicates;
}

const mergeTechnologies = (technologies: string[]) => {
  const mergedMap = new Map<string, { originalName: string; details: Set<string> }>();

  technologies.forEach((tech) => {
    const openParenIndex = tech.indexOf("(");
    let name = tech;
    let detailsStr = "";

    if (openParenIndex !== -1 && tech.endsWith(")")) {
      name = tech.substring(0, openParenIndex).trim();
      detailsStr = tech.substring(openParenIndex + 1, tech.length - 1);
    }

    const normalizedKey = normalizeString(name);

    if (!mergedMap.has(normalizedKey)) {
      mergedMap.set(normalizedKey, { originalName: name, details: new Set() });
    }

    if (detailsStr) {
      const parts = detailsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parts.forEach((p) => mergedMap.get(normalizedKey)!.details.add(p));
    }
  });

  return Array.from(mergedMap.values()).map(({ originalName, details }) => {
    if (details.size === 0) return originalName;
    return `${originalName} (${Array.from(details).join(", ")})`;
  });
};

export const getSummary = (projects: IProject[], technologiesMap: ITechnologiesMap) => {
  const summary: Map = {
    [SectionsNames.ProgrammingLanguages]: [],
    [SectionsNames.Frontend]: [],
    [SectionsNames.BackendTechnologies]: [],
    [SectionsNames.JavaFrameworks]: [],
    [SectionsNames.Containerization]: [],
    [SectionsNames.CiCd]: [],
    [SectionsNames.Cloud]: [],
    [SectionsNames.Databases]: [],
    [SectionsNames.VersionControlSystems]: [],
    [SectionsNames.AITools]: [],
  };
  const technologies = projects.flatMap(({ technologies }) => technologies ?? []);
  const mergedTechnologies = mergeTechnologies(technologies);
  const uniqueTechnologies = Array.from(new Set<string>(mergedTechnologies));

  const techDetails = uniqueTechnologies.map((tech) => {
    const techNameWithoutBraces = tech.replace(/\([^()]*\)/g, "");
    return {
      original: tech,
      normalized: normalizeString(tech),
      map: technologiesMap[normalizeString(techNameWithoutBraces)],
    };
  });

  techDetails
    .sort((a, b) => {
      // If Map have both of technologies we make sorting
      if (a.map && b.map) {
        return a.map.orderWeight - b.map.orderWeight;
      }
      // If Map don't have a technologies
      return 0;
    })
    .forEach(({ original, map }) => {
      if (!map) return;

      const section = map.name as SectionsNames;

      if (summary[section]) {
        summary[section]!.push(original);
      } else {
        summary[SectionsNames.Frontend]!.push(original);
      }
    });

  // Delete empty summary sections
  for (const key in summary) {
    const typedKey = key as keyof typeof summary;

    if (summary[typedKey]!.length === 0) {
      delete summary[typedKey];
    }
  }

  const duplicatedValues = findDuplicates(technologies);
  const hasCollisions = duplicatedValues.length > 0;

  return { summary, hasCollisions, duplicatedValues };
};
