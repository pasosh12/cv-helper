import { Employee } from "@/modules/constants";
import { findClosestEmployeeByFileName } from "./getFileNameHrmMatch";

/**
 * Pins down which HRM employee an uploaded file belongs to from its file
 * name. Unlike the CV's self-intro name (first name plus an abbreviated last
 * name), the file name carries both names in full, so it's the more reliable
 * source - small typos and the reversed "Name Surname" order are tolerated.
 * Returns undefined when no employee is close enough.
 */
export const resolveEmployeeFromFileName = (
  fileName: string,
  employeesList: Employee[],
): Employee | undefined => {
  const closest = findClosestEmployeeByFileName(fileName, employeesList);

  return closest?.isCloseEnough ? closest.employee : undefined;
};
