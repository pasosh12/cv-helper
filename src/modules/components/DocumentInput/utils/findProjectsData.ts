import { getCurrentMonth } from "@/modules/utils/getCurrentMonth";
import { normalizeString } from "@/modules/utils/normalizeString";
import {
  isNormalizedName,
  removeLastDot,
  splitStringByCommaWithoutCommasInBraces,
} from "./helpers";

type ProjectData = {
  dates: string[];
  technologies: string[];
  name: string;
  description: string;
  responsibilities: string[];
};

const convertDate = (str: string) => {
  return `${str.slice(3)}-${str.slice(0, 2)}`;
};

const prepareTechnologiesArr = (technologies: string) => {
  const technologiesArr = splitStringByCommaWithoutCommasInBraces(technologies);
  const technologiesArrWithoutLastDotInLastElement = removeLastDot(technologiesArr);
  return technologiesArrWithoutLastDotInLastElement;
};

export const findProjectsData = (htmlStr: string) => {
  const regExp = /<[^>]*>/gm;
  const arrWithProjectStrings = htmlStr.split(regExp).filter((item) => item !== "");

  const projectData = arrWithProjectStrings.reduce(
    (
      acc: {
        dates: string[][];
        technologies: string[];
        projectsNames: string[];
        projectsDescriptions: string[];
        responsibilities: string[][];
      },
      item,
      index,
      array,
    ) => {
      const nextItemIndex = 1;
      const previousTwoItemsIndex = -2;
      const previousOneItemsIndex = -1;

      const periodName = normalizeString(item);
      if (isNormalizedName("period", periodName)) {
        const dateString = array[index + nextItemIndex];
        const firstDate = convertDate(dateString.slice(0, 7));
        const lastDate = isNormalizedName("tillNow", normalizeString(dateString.slice(10)))
          ? getCurrentMonth()
          : convertDate(dateString.slice(10));
        acc.dates.push([firstDate, lastDate]);
      }

      const environmentName = normalizeString(item);
      if (isNormalizedName("environment", environmentName)) {
        acc.technologies.push(array[index + nextItemIndex]);
      }

      const projectRolesName = normalizeString(item);
      if (isNormalizedName("projectRoles", projectRolesName)) {
        acc.projectsNames.push(array[index + previousTwoItemsIndex]);
        acc.projectsDescriptions.push(array[index + previousOneItemsIndex]);
      }

      const responsibilitiesName = normalizeString(item);
      if (isNormalizedName("responsibilities", responsibilitiesName)) {
        const subArrayFromResponsibilitiesIndex = array.slice(index + 1);
        const indexOfEnvironmentName = subArrayFromResponsibilitiesIndex.findIndex((item) =>
          isNormalizedName("environment", normalizeString(item)),
        );
        const responsibilities = subArrayFromResponsibilitiesIndex.slice(0, indexOfEnvironmentName);

        acc.responsibilities.push(responsibilities);
      }

      return acc;
    },
    {
      dates: [],
      technologies: [],
      projectsNames: [],
      projectsDescriptions: [],
      responsibilities: [],
    },
  );

  const result: ProjectData[] = [];

  if (projectData.dates.length === projectData.technologies.length) {
    for (let key = 0; key < projectData.dates.length; key++) {
      const preparedObject: ProjectData = {
        dates: projectData.dates[key],
        technologies: prepareTechnologiesArr(projectData.technologies[key]),
        name: projectData.projectsNames[key],
        description: projectData.projectsDescriptions[key],
        responsibilities: projectData.responsibilities[key],
      };

      result.push(preparedObject);
    }
  }

  return result;
};
