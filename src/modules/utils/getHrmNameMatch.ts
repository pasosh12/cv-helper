import { Employee } from "@/modules/constants";
import { levenshteinDistance } from "./levenshteinDistance";
import { MAX_SUGGESTION_DISTANCE_RATIO } from "./nameMatchingConstants";
import { normalizeString } from "./normalizeString";

export interface HrmNameMatch {
  /** The candidate name matches someone in the HRM export. */
  isMatch: boolean;
  /** Closest HRM name worth suggesting, only set when isMatch is false. */
  recommendedEmployee?: Employee;
}

/**
 * Compares the name parsed from an uploaded CV against the HRM employees
 * roster. A CV name always starts with the first name, followed by the last
 * name abbreviated to one or two letters (e.g. "Х" is transliterated as
 * "Kh") - so the last name can't be checked reliably, only the first name.
 */
export const getHrmNameMatch = (name: string, employeesList: Employee[]): HrmNameMatch | null => {
  const normalizedCandidate = normalizeString(name || "");

  if (!normalizedCandidate) {
    return null;
  }

  const firstNameToken = (name || "").trim().split(/\s+/)[0] || "";
  const normalizedFirstName = normalizeString(firstNameToken);

  const hasFirstNameMatch = employeesList.some(
    (employee) => normalizeString(employee.firstName) === normalizedFirstName,
  );

  if (hasFirstNameMatch) {
    return { isMatch: true };
  }

  let closestEmployee: Employee | undefined;
  let closestDistance = Infinity;

  employeesList.forEach((employee) => {
    const direct = normalizeString(`${employee.firstName}${employee.lastName}`);
    const reversed = normalizeString(`${employee.lastName}${employee.firstName}`);
    const distance = Math.min(
      levenshteinDistance(normalizedCandidate, direct),
      levenshteinDistance(normalizedCandidate, reversed),
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestEmployee = employee;
    }
  });

  if (!closestEmployee) {
    return { isMatch: false };
  }

  const closestNameLength = normalizeString(
    `${closestEmployee.firstName}${closestEmployee.lastName}`,
  ).length;
  const maxLength = Math.max(normalizedCandidate.length, closestNameLength);
  const isCloseEnoughToSuggest = closestDistance / maxLength <= MAX_SUGGESTION_DISTANCE_RATIO;

  return {
    isMatch: false,
    recommendedEmployee: isCloseEnoughToSuggest ? closestEmployee : undefined,
  };
};
