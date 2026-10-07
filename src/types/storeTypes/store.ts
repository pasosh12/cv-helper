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
  importResetSignal: number;
  technologiesMap: ITechnologiesMap;
  table: ITechnologiesTableData;
  name: string;
  roles: string;
  education: string;
  selfIntro: string;
  fileName: string;
  /** Google Drive file id the current CV was imported from, or null for a local upload. */
  sourceDocId: string | null;
  /** True when sourceDocId points to a native Google Doc (editable via the Docs API). */
  isNativeGoogleDoc: boolean;
  projects: IProject[];
  summary: ISummaryField;
  hasCollisions: boolean;
  duplicatedValues: string[];
  notFoundTechnologies: string[];
  addSelfInfo: (selfInfo: SelfInfo) => void;
  clearStore: () => void;
  clearAll: () => void;
  addEmptyProject: () => void;
  addProject: (project: IProject) => void;
  setFileName: (name: string) => void;
  setName: (name: string) => void;
  setSourceDoc: (docId: string | null, isNativeGoogleDoc: boolean) => void;
  setDate: (id: number, dates: string, range: number) => void;
  setTechnologies: (id: number, technologies: string) => void;
}
