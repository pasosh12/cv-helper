export interface IProject {
  id: number;
  firstDate: string;
  lastDate: string;
  technologies: string[] | null;
  responsibilities: string[];
  dateRange: number;
  name: string;
  description: string;
}

export interface IProjectData {
  dates: string[];
  technologies: string[];
  name: string;
  description: string;
  responsibilities: string[];
}

export interface ITechnologiesMap {
  [index: string]: { name: string; orderWeight: number };
}

export interface ITechnology {
  name: string;
  range: number;
  lastUsed: string;
}

export interface ITechnologiesTableData {
  [index: string]: ITechnology[];
}

export interface ISummaryField {
  [index: string]: string[];
}

export interface SelfInfo {
  name: string;
  roles: string;
  education: string;
  selfIntro: string;
}

export interface IProjectsStore {
  nextId: number;
  technologiesMap: ITechnologiesMap;
  table: ITechnologiesTableData;
  name: string;
  roles: string;
  education: string;
  selfIntro: string;
  fileName: string;
  projects: IProject[];
  summary: ISummaryField;
  hasCollisions: boolean;
  duplicatedValues: string[];
  notFoundTechnologies: string[];
  addSelfInfo: (selfInfo: SelfInfo) => void;
  clearStore: () => void;
  addEmptyProject: () => void;
  addProject: (project: IProject) => void;
  setFileName: (name: string) => void;
  setDate: (id: number, dates: string, range: number) => void;
  setTechnologies: (id: number, technologies: string) => void;
}
