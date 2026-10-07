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
    return { isMatch: false };
  }

  if (closestDistance === 0) {
    return closestIsCorrectOrder
      ? { isMatch: true }
      : {
          isMatch: false,
          recommendedFileName: `${closestEmployee.lastName} ${closestEmployee.firstName}`,
        };
  }

  const closestNameLength =
    normalizeString(closestEmployee.firstName).length +
    normalizeString(closestEmployee.lastName).length;
  const maxLength = Math.max(tokensLength, closestNameLength);
  const isCloseEnoughToSuggest = closestDistance / maxLength <= MAX_SUGGESTION_DISTANCE_RATIO;

  return {
    isMatch: false,
    recommendedFileName: isCloseEnoughToSuggest
      ? `${closestEmployee.lastName} ${closestEmployee.firstName}`
      : undefined,
  };
};
