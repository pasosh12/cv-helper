import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { getHrmNameMatch } from "./getHrmNameMatch";

describe("getHrmNameMatch", () => {
  it("returns null when there is no name to check yet", () => {
    expect(getHrmNameMatch("", employees)).toBeNull();
  });

  it("matches on the first name alone, even with an abbreviated surname", () => {
    expect(getHrmNameMatch("Uladzislau B.", employees)).toEqual({ isMatch: true });
    expect(getHrmNameMatch("Nikita M.", employees)).toEqual({ isMatch: true });
  });

  it("doesn't care whether the abbreviation after the first name is right", () => {
    // CVs always abbreviate the surname (sometimes to a transliteration like
    // "Х" -> "Kh"), so only the first name is checked.
    expect(getHrmNameMatch("Uladzislau Zzz", employees)).toEqual({ isMatch: true });
  });

  it("flags a typo'd first name and recommends the closest real one", () => {
    const result = getHrmNameMatch("Uladzyslau B.", employees);
    expect(result?.isMatch).toBe(false);
    expect(result?.recommendedEmployee?.firstName).toBe("Uladzislau");
  });

  it("gives no recommendation for a name with nothing close in the roster", () => {
    expect(getHrmNameMatch("Zzzyxx Qqqrrr", employees)).toEqual({ isMatch: false });
  });

  describe("against every real employee in the roster", () => {
    it("recognizes each employee's own abbreviated CV name as a match", () => {
      employees.forEach((employee) => {
        const abbreviatedCvName = `${employee.firstName} ${employee.lastName[0]}.`;
        expect(getHrmNameMatch(abbreviatedCvName, employees)).toEqual({ isMatch: true });
      });
    });
  });
});
