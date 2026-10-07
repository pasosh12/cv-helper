import { Employee } from "@/modules/constants";

/**
 * Formats an employee's name the way a CV always does: first name in full,
 * last name abbreviated to its first letter (e.g. "Uladzislau B."), since
 * that's the only form the "Recommended" suggestion can safely stand in for.
 */
export const formatAbbreviatedName = (employee: Pick<Employee, "firstName" | "lastName">): string =>
  `${employee.firstName} ${employee.lastName[0]}.`;
