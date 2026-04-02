import { makeAutoObservable, runInAction } from "mobx";
import {
  IProjectsStore,
  ITechnologiesTableData,
  IProject,
  ITechnologiesMap,
  ISummaryField,
  SelfInfo,
} from "@/types/storeTypes/store";
import { getCurrentMonth } from "@/modules/utils/getCurrentMonth";
import { normalizeDates } from "@/modules/utils/normalizeDates";
import { getSummary, getTableOfTechnologies, getTechnologiesMap } from "./helpers";
import { splitStringByCommaWithoutCommasInBraces } from "@/modules/components/DocumentInput/utils/helpers/splitStringByCommaWithoutCommasInBraces";

const currentMonth = getCurrentMonth();

export class ProjectsStore implements IProjectsStore {
  nextId: number = 1;
  technologiesMap: ITechnologiesMap = {};
  projects: IProject[] = [
    {
      id: 0,
      firstDate: currentMonth,
      lastDate: currentMonth,
      dateRange: 0,
      technologies: [],
      responsibilities: [],
      name: "",
      description: "",
    },
  ];
  table: ITechnologiesTableData = {};
  summary: ISummaryField = {};
  hasCollisions: boolean = false;
  duplicatedValues: string[] = [];
  notFoundTechnologies: string[] = [];
  tableLink: string = "";
  fileName: string = "";
  name = "";
  roles = "";
  education: string = "";
  selfIntro: string = "";

  constructor() {
    makeAutoObservable(this);
    this.fetchTableData();
  }

  private updateProjects = () => {
    this.projects = normalizeDates(this.projects);
  };

  private updateSummary = () => {
    const { summary, hasCollisions, duplicatedValues } = getSummary(
      this.projects,
      this.technologiesMap,
    );
    this.summary = summary;
    this.hasCollisions = hasCollisions;
    this.duplicatedValues = duplicatedValues;
  };

  private updateTable = () => {
    const { table, notFoundTechnologies } = getTableOfTechnologies(
      this.projects,
      this.technologiesMap,
    );
    this.table = table;
    this.notFoundTechnologies = notFoundTechnologies;
  };

  private updateProjectsSummaryAndTable = () => {
    this.updateProjects();
    this.updateTable();
    this.updateSummary();
  };

  addSelfInfo = (selfInfo: SelfInfo) => {
    runInAction(() => {
      this.name = selfInfo.name;
      this.roles = selfInfo.roles;
      this.education = selfInfo.education;
      this.selfIntro = selfInfo.selfIntro;
    });
  };

  clearStore = () => {
    runInAction(() => {
      this.name = "";
      this.roles = "";
      this.education = "";
      this.selfIntro = "";
      this.projects = [];
      this.table = {};
      this.notFoundTechnologies = [];
      this.nextId = 0;
      this.summary = {};
      this.fileName = "";
    });
  };

  setFileName = (name: string) => {
    runInAction(() => {
      this.fileName = name;
    });
  };

  addEmptyProject = () => {
    const firstDate = this.projects[this.nextId - 1]?.firstDate ?? getCurrentMonth();
    const lastDate = this.projects[this.nextId - 1]?.firstDate ?? getCurrentMonth();

    this.projects.push({
      id: this.nextId,
      firstDate,
      lastDate,
      dateRange: 0,
      responsibilities: [],
      technologies: [],
      name: "",
      description: "",
    });

    this.nextId = this.nextId + 1;
  };

  addProject = (project: IProject) => {
    runInAction(() => {
      this.projects.push({
        ...project,
        id: this.nextId,
      });

      this.updateProjectsSummaryAndTable();
      this.nextId = this.nextId + 1;
    });
  };

  setDate = (id: number, firstDate: string, range: number) => {
    runInAction(() => {
      const targetProject = this.projects.find((obj) => obj.id === id);

      if (targetProject) {
        targetProject.firstDate = firstDate;
        targetProject.dateRange = range;
      }
      this.updateProjectsSummaryAndTable();
    });
  };

  setTechnologies = (id: number, technologies: string) => {
    runInAction(() => {
      const targetProject = this.projects.find((obj) => obj.id === id);
      const technologiesArr = splitStringByCommaWithoutCommasInBraces(technologies);

      if (targetProject) {
        targetProject.technologies = technologiesArr ?? [];
      }
      this.updateTable();
      this.updateSummary();
    });
  };

  setTableLink = (link?: string) => {
    runInAction(() => {
      this.tableLink = link || import.meta.env.VITE_GOOGLE_SHEET_DEPLOY;
    });
  };

  fetchTableData = async (tableLink?: string) => {
    const url = tableLink || import.meta.env.VITE_GOOGLE_SHEET_DEPLOY || "";

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const { data } = await response.json();

      // Обновляем состояние внутри runInAction для MobX
      runInAction(() => {
        this.technologiesMap = getTechnologiesMap(data);
        this.updateProjectsSummaryAndTable();
      });
    } catch (error) {
      console.error("Failed to fetch table data:", error);
      throw new Error("Failed to fetch table data");
    }
  };
}

export const projectsStore = new ProjectsStore();
