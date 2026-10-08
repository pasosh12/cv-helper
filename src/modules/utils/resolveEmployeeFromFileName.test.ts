import { describe, expect, it } from "vitest";
import { employees } from "@/modules/constants";
import { resolveEmployeeFromFileName } from "./resolveEmployeeFromFileName";

describe("resolveEmployeeFromFileName", () => {
  it("returns undefined when the file name doesn't have two name-like tokens", () => {
    expect(resolveEmployeeFromFileName("resume.docx", employees)).toBeUndefined();
  });

  it("finds the employee from a 'Surname Name' file name", () => {
    // The CV itself may say "Polina H.", which would point to another employee.
    expect(resolveEmployeeFromFileName("Khairullina Palina 5+.docx", employees)?.id).toBe(3793);
  });

  it("finds the employee from a reversed or misspelled file name", () => {
    expect(resolveEmployeeFromFileName("Palina_Khairullina.docx", employees)?.id).toBe(3793);
    expect(resolveEmployeeFromFileName("Khairulina Polina.docx", employees)?.id).toBe(3793);
  });

  it("returns undefined for a completely unrelated file name", () => {
    expect(resolveEmployeeFromFileName("random_unrelated_name.docx", employees)).toBeUndefined();
  });
});
