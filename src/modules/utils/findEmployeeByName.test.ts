import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { findEmployeeByName } from "./findEmployeeByName";

describe("findEmployeeByName", () => {
  it("matches an exact full name, in either order", () => {
    expect(findEmployeeByName("Uladzislau Bulynka", employees)?.id).toBe(4341);
    expect(findEmployeeByName("Bulynka Uladzislau", employees)?.id).toBe(4341);
  });

  it("ignores case, spacing and punctuation", () => {
    expect(findEmployeeByName("  uladzislau   BULYNKA! ", employees)?.id).toBe(4341);
  });

  it("returns undefined for an empty name", () => {
    expect(findEmployeeByName("", employees)).toBeUndefined();
  });

  it("returns undefined for a name that isn't in the roster", () => {
    expect(findEmployeeByName("Zzzyxx Qqqrrr", employees)).toBeUndefined();
  });
});
