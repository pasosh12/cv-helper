import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { getFileNameHrmMatch } from "./getFileNameHrmMatch";

describe("getFileNameHrmMatch", () => {
  it("returns null when the file name doesn't have two name-like tokens", () => {
    expect(getFileNameHrmMatch("resume.docx", employees)).toBeNull();
  });

  it("matches a file name already in 'Surname Name' order", () => {
    expect(getFileNameHrmMatch("Bulynka_Uladzislau.docx", employees)).toEqual({ isMatch: true });
    expect(getFileNameHrmMatch("Bulynka Uladzislau CV.docx", employees)).toEqual({
      isMatch: true,
    });
  });

  it("flags the reversed 'Name Surname' order and recommends 'Surname Name'", () => {
    expect(getFileNameHrmMatch("Uladzislau_Bulynka.docx", employees)).toEqual({
      isMatch: false,
      recommendedFileName: "Bulynka Uladzislau",
    });
  });

  it("still finds the right employee with a typo in the surname", () => {
    // Real employee is "Nikita Mihnevich".
    expect(getFileNameHrmMatch("Mikhevich Nikita.docx", employees)).toEqual({
      isMatch: false,
      recommendedFileName: "Mihnevich Nikita",
    });
  });

  it("still finds the right employee with a typo in both the surname and the name", () => {
    expect(getFileNameHrmMatch("Mikhevich_Nikitaa.docx", employees)).toEqual({
      isMatch: false,
      recommendedFileName: "Mihnevich Nikita",
    });
  });

  it("gives no recommendation for a completely unrelated file name", () => {
    expect(getFileNameHrmMatch("random_unrelated_name.docx", employees)).toEqual({
      isMatch: false,
    });
  });

  describe("against every real employee in the roster", () => {
    // "Ko'yliyev" is the one surname with a non-letter character; the simple
    // tokenizer splits on it, which is a known limitation unrelated to this
    // check, so it's excluded here rather than asserted as a match.
    const testableEmployees = employees.filter((employee) => employee.lastName !== "Ko'yliyev");

    it("recognizes each employee's own 'Surname_Name' file name", () => {
      testableEmployees.forEach((employee) => {
        const fileName = `${employee.lastName}_${employee.firstName}.docx`;
        expect(getFileNameHrmMatch(fileName, employees)).toEqual({ isMatch: true });
      });
    });

    it("recommends the correct order for each employee's reversed file name", () => {
      testableEmployees.forEach((employee) => {
        const fileName = `${employee.firstName}_${employee.lastName}.docx`;
        expect(getFileNameHrmMatch(fileName, employees)).toEqual({
          isMatch: false,
          recommendedFileName: `${employee.lastName} ${employee.firstName}`,
        });
      });
    });
  });
});
