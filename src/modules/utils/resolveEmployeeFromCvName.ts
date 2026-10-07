import { Employee } from "@/modules/constants";
import { normalizeString } from "./normalizeString";

/**
 * Tries to pin down which specific HRM employee a CV's self-intro name
 * belongs to. A CV name always starts with the first name followed by the
 * last name abbreviated to its first one or two letters, so the first name
 * alone is often ambiguous (several employees can share it) - when it is,
 * the abbreviation (if present) is used to narrow it down to one person.
 * Returns undefined when no employee - or more than one - fits.
 */
export const resolveEmployeeFromCvName = (
  name: string,
  employeesList: Employee[],
): Employee | undefined => {
  const tokens = (name || "").trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return undefined;
  }

  const [firstToken, secondToken] = tokens;
  const normalizedFirstToken = normalizeString(firstToken);

  const firstNameMatches = employeesList.filter(
    (employee) => normalizeString(employee.firstName) === normalizedFirstToken,
  );

  if (firstNameMatches.length === 0) {
    return undefined;
  }

  if (firstNameMatches.length === 1) {
    return firstNameMatches[0];
  }

  const normalizedAbbreviation = normalizeString(secondToken || "");

  if (!normalizedAbbreviation) {
    return undefined;
  }

  const narrowedMatches = firstNameMatches.filter((employee) =>
    normalizeString(employee.lastName).startsWith(normalizedAbbreviation),
  );

  return narrowedMatches.length === 1 ? narrowedMatches[0] : undefined;
};
