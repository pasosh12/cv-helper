import { describe, expect, it } from "vitest";
import { SectionsNames } from "@/enums/sectionsNames";
import { getBroadSection } from "./getBroadSection";

describe("getBroadSection", () => {
  it("puts message brokers into their own group whatever the sheet section", () => {
    expect(getBroadSection(SectionsNames.BackendTechnologies, "RabbitMQ")).toBe(
      SectionsNames.MessageBrokers,
    );
    expect(getBroadSection(SectionsNames.Cloud, "AWS SQS")).toBe(SectionsNames.MessageBrokers);
  });

  it("merges containerization and CI/CD into DevOps", () => {
    expect(getBroadSection(SectionsNames.Containerization, "Podman")).toBe(SectionsNames.DevOps);
    expect(getBroadSection(SectionsNames.CiCd, "GitHub Actions")).toBe(SectionsNames.DevOps);
    expect(getBroadSection(SectionsNames.LoggingTools, "Sentry")).toBe(SectionsNames.DevOps);
  });

  it("renames Cloud to Clouds but keeps DynamoDB in Databases", () => {
    expect(getBroadSection(SectionsNames.Cloud, "AWS (EC2, ECS, S3)")).toBe(SectionsNames.Clouds);
    expect(getBroadSection(SectionsNames.Cloud, "AWS DynamoDB")).toBe(SectionsNames.Databases);
  });

  it("keeps broad sections and merges frontend sheet sections into Frontend", () => {
    expect(getBroadSection(SectionsNames.Databases, "PostgreSQL")).toBe(SectionsNames.Databases);
    expect(getBroadSection(SectionsNames.UiLibraries, "MUI")).toBe(SectionsNames.Frontend);
    expect(getBroadSection(SectionsNames.JavascriptLibraries, "React")).toBe(
      SectionsNames.Frontend,
    );
  });

  it("moves backend technologies out of frontend sheet sections", () => {
    expect(getBroadSection("Javascript libraries and frameworks", "Keycloak")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection("Data visualization", "JasperReports")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection("Testing frameworks and tools", "Testcontainers.MsSql")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection("Testing frameworks and tools", "Vitest")).toBe(SectionsNames.Frontend);
    expect(getBroadSection("Java frameworks", "Spring Boot")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection("Python libraries and frameworks", "Jinja2")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection(".Net frameworks", "AutoMapper")).toBe(
      SectionsNames.BackendTechnologies,
    );
    expect(getBroadSection("Services Integration", "Nylas")).toBe(
      SectionsNames.BackendTechnologies,
    );
  });

  it("leaves other sheet sections out instead of falling back to Frontend", () => {
    expect(getBroadSection("IDE", "Webstorm")).toBeNull();
    expect(getBroadSection("Collaboration Tools", "Jira")).toBeNull();
  });
});
