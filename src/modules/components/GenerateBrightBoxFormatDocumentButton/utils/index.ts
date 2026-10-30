import { IProject, ISummaryField } from "@/types/storeTypes";
import { SectionsNames } from "@/enums/sectionsNames";

const summaryWeights: Partial<Record<SectionsNames, number>> = {
  [SectionsNames.ProgrammingLanguages]: 0,
  [SectionsNames.Frontend]: 1,
  [SectionsNames.BackendTechnologies]: 2,
  [SectionsNames.MessageBrokers]: 3,
  [SectionsNames.Databases]: 4,
  [SectionsNames.Clouds]: 5,
  [SectionsNames.DevOps]: 6,
  [SectionsNames.VersionControlSystems]: 7,
  [SectionsNames.AITools]: 8,
};

// Summary data must be converted from
// {
//   'Progaramming Languages': ['JavaScript', 'Typescript'],
//   Frontend: ['React', 'Redux']
// }
// to
// [
//   {
//     name: 'Progaramming Languages',
//     data: 'JavaScript, Typescript'
//   },
//   {
//     name: 'Frontend',
//     data: 'React, Redux'
//   }
// ]

export const prepareSummaryData = (summary: ISummaryField) => {
  return Object.entries(summary)
    .map(([summaryName, arr]) => ({
      summaryName,
      summaryData: arr.join(", "),
    }))
    .sort((a, b) => {
      const first = summaryWeights[a.summaryName as keyof Partial<Record<SectionsNames, number>>];
      const second = summaryWeights[b.summaryName as keyof Partial<Record<SectionsNames, number>>];

      if (!first || !second) return 1;

      return first - second;
    });
};

const convertDateFormat = (date: IProject["firstDate"] | IProject["lastDate"]) => {
  const [year, month] = date.split("-");

  return `${month}.${year}`;
};

export const prepareProjectsData = (projects: IProject[]) =>
  projects.map((project) => {
    const preparedDate = `${convertDateFormat(project.firstDate)} - ${convertDateFormat(project.lastDate)}`;
    const preparedResponsibilities = project.responsibilities.map((resp) => ({
      resp,
    }));
    const preparedTechnologies = project.technologies?.map((tech) => ({ tech }));

    return {
      ...project,
      date: preparedDate,
      responsibilities: preparedResponsibilities,
      technologies: preparedTechnologies,
    };
  });
