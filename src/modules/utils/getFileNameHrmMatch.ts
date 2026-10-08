import { Employee } from "@/modules/constants";
import { levenshteinDistance } from "./levenshteinDistance";
import { MAX_SUGGESTION_DISTANCE_RATIO } from "./nameMatchingConstants";
import { normalizeString } from "./normalizeString";

export interface FileNameHrmMatch {
  /** The file name already starts with "Surname Name", as in the HRM export. */
  isMatch: boolean;
  /** "Surname Name" form to suggest instead, only set when isMatch is false. */
  recommendedFileName?: string;
}

export interface ClosestFileNameEmployee {
  employee: Employee;
  /** Summed Levenshtein distance of both tokens to the employee's names. */
  distance: number;
  /** The tokens were closest when read as "Surname Name". */
  isCorrectOrder: boolean;
  /** Whether the match is close enough to trust as the same person. */
  isCloseEnough: boolean;
}

/**
 * Finds the HRM employee whose name is closest to the first two name-like
 * tokens of a file name, reading them in either order. Returns null when the
 * file name doesn't have two such tokens.
 */
export const findClosestEmployeeByFileName = (
  fileName: string,
  employeesList: Employee[],
): ClosestFileNameEmployee | null => {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const tokens = baseName.split(/[^a-zA-Zа-яА-ЯёЁ]+/).filter(Boolean);

  if (tokens.length < 2) {
    return null;
  }

  const [first, second] = tokens;
  const normalizedFirst = normalizeString(first);
  const normalizedSecond = normalizeString(second);
  const tokensLength = normalizedFirst.length + normalizedSecond.length;

  let closestEmployee: Employee | undefined;
  let closestIsCorrectOrder = false;
  let closestDistance = Infinity;

  employeesList.forEach((employee) => {
    const normalizedFirstName = normalizeString(employee.firstName);
    const normalizedLastName = normalizeString(employee.lastName);

    // Tokens read as "Surname Name" (the expected order).
    const distanceAsSurnameFirst =
      levenshteinDistance(normalizedFirst, normalizedLastName) +
      levenshteinDistance(normalizedSecond, normalizedFirstName);

    // Tokens read as "Name Surname" (reversed).
    const distanceAsNameFirst =
      levenshteinDistance(normalizedFirst, normalizedFirstName) +
      levenshteinDistance(normalizedSecond, normalizedLastName);

    if (distanceAsSurnameFirst < closestDistance) {
      closestDistance = distanceAsSurnameFirst;
      closestEmployee = employee;
      closestIsCorrectOrder = true;
    }

    if (distanceAsNameFirst < closestDistance) {
      closestDistance = distanceAsNameFirst;
      closestEmployee = employee;
      closestIsCorrectOrder = false;
    }
  });

  if (!closestEmployee) {
    return null;
  }

  const closestNameLength =
    normalizeString(closestEmployee.firstName).length +
    normalizeString(closestEmployee.lastName).length;
  const maxLength = Math.max(tokensLength, closestNameLength);

  return {
    employee: closestEmployee,
    distance: closestDistance,
    isCorrectOrder: closestIsCorrectOrder,
    isCloseEnough: closestDistance / maxLength <= MAX_SUGGESTION_DISTANCE_RATIO,
  };
};

/**
 * Checks whether an uploaded file's name follows the "Surname Name" order
 * used by the HRM export (the source of truth), unlike the CV's own
 * self-intro line, which always starts with the first name.
 *
 * Matching is distance-based rather than exact, so a typo in either the
 * surname or the name (or both, e.g. "Mikhevich Nikita" for the real
 * "Mihnevich Nikita") still surfaces the closest real employee instead of
 * silently giving up.
 */
export const getFileNameHrmMatch = (
  fileName: string,
  employeesList: Employee[],
): FileNameHrmMatch | null => {
  const closest = findClosestEmployeeByFileName(fileName, employeesList);

  if (!closest) {
    return null;
  }

  const { employee, distance, isCorrectOrder, isCloseEnough } = closest;
  const recommendedFileName = `${employee.lastName} ${employee.firstName}`;

  if (distance === 0) {
    return isCorrectOrder ? { isMatch: true } : { isMatch: false, recommendedFileName };
  }

  return {
    isMatch: false,
    recommendedFileName: isCloseEnough ? recommendedFileName : undefined,
  };
};
