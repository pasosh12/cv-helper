import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { formatAbbreviatedName } from "./formatAbbreviatedName";

describe("formatAbbreviatedName", () => {
  it("keeps the first name in full and abbreviates the surname to its first letter", () => {
    expect(formatAbbreviatedName({ firstName: "Uladzislau", lastName: "Bulynka" })).toBe(
      "Uladzislau B.",
    );
  });

  it("matches this format for every real employee in the roster", () => {
    employees.forEach((employee) => {
      expect(formatAbbreviatedName(employee)).toBe(
        `${employee.firstName} ${employee.lastName[0]}.`,
      );
    });
  });
});
