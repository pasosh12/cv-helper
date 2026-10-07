import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { resolveEmployeeFromCvName } from "./resolveEmployeeFromCvName";

describe("resolveEmployeeFromCvName", () => {
  it("resolves immediately when the first name is unique in the roster", () => {
    expect(resolveEmployeeFromCvName("Mikalai Hur.", employees)?.lastName).toBe("Hurynovich");
  });

  it("disambiguates a shared first name using the abbreviated surname", () => {
    // "Uladzislau" is shared by 8 employees; "Kar." / "B." each narrow it to one.
    expect(resolveEmployeeFromCvName("Uladzislau Kar.", employees)?.lastName).toBe("Karol");
    expect(resolveEmployeeFromCvName("Uladzislau B.", employees)?.lastName).toBe("Bulynka");
  });

  it("gives up when the abbreviation still matches more than one surname", () => {
    // Both "Karol" and "Kazadoi" start with "Ka".
    expect(resolveEmployeeFromCvName("Uladzislau Ka.", employees)).toBeUndefined();
  });

  it("gives up when the first name alone is ambiguous and there's no abbreviation", () => {
    expect(resolveEmployeeFromCvName("Uladzislau", employees)).toBeUndefined();
  });

  it("returns undefined for an empty name or one not in the roster", () => {
    expect(resolveEmployeeFromCvName("", employees)).toBeUndefined();
    expect(resolveEmployeeFromCvName("Zzzyxx Qqqrrr", employees)).toBeUndefined();
  });
});
