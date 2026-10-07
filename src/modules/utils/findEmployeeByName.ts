import { Employee } from "@/modules/constants";
import { normalizeString } from "@/modules/utils/normalizeString";

/**
 * Tries to match a free-form candidate name (as parsed from an uploaded CV)
 * against the employees roster, ignoring case/spacing/punctuation and
 * tolerating either "First Last" or "Last First" order.
 */
export const findEmployeeByName = (
  name: string,
  employeesList: Employee[],
): Employee | undefined => {
  const normalizedCandidate = normalizeString(name || "");

  if (!normalizedCandidate) {
    return undefined;
  }

  return employeesList.find((employee) => {
    const direct = normalizeString(`${employee.firstName}${employee.lastName}`);
    const reversed = normalizeString(`${employee.lastName}${employee.firstName}`);

    return (
      normalizedCandidate === direct ||
      normalizedCandidate === reversed ||
      normalizedCandidate.includes(direct) ||
      normalizedCandidate.includes(reversed)
    );
  });
};
