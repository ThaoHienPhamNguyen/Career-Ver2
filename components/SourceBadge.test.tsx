// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourceBadge, getSourceBadgeLabel } from "./SourceBadge";

describe("getSourceBadgeLabel", () => {
  it("returns the seed label for source seed", () => {
    expect(getSourceBadgeLabel("seed")).toBe("Đã đối chiếu nguồn");
  });

  it("returns the generated label for source generated", () => {
    expect(getSourceBadgeLabel("generated")).toBe("AI tổng hợp, đang chờ xác thực");
  });
});

describe("SourceBadge", () => {
  it("renders the seed badge text", () => {
    render(<SourceBadge source="seed" />);
    expect(screen.getByText("Đã đối chiếu nguồn")).toBeInTheDocument();
  });

  it("renders the generated badge text", () => {
    render(<SourceBadge source="generated" />);
    expect(screen.getByText("AI tổng hợp, đang chờ xác thực")).toBeInTheDocument();
  });
});
