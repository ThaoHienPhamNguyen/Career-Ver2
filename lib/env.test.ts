import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getRequiredEnv } from "./env";

describe("getRequiredEnv", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the value when the env var is set", () => {
    process.env.TEST_VAR = "hello";
    expect(getRequiredEnv("TEST_VAR")).toBe("hello");
  });

  it("throws a descriptive error when the env var is missing", () => {
    delete process.env.TEST_VAR;
    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR"
    );
  });
});
