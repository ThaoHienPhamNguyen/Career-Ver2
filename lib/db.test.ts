import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "./db";

describe("prisma JobTitle model", () => {
  afterEach(async () => {
    await prisma.jobTitle.deleteMany({ where: { canonicalName: "Test Job Title" } });
  });

  it("creates and reads back a JobTitle row", async () => {
    const created = await prisma.jobTitle.create({
      data: {
        canonicalName: "Test Job Title",
        source: "seed",
        content: { description: "test" },
      },
    });

    const found = await prisma.jobTitle.findUnique({
      where: { canonicalName: "Test Job Title" },
    });

    expect(found?.id).toBe(created.id);
    expect(found?.source).toBe("seed");
  });
});
