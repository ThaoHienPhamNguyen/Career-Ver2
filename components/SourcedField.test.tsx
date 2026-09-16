// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourcedField, SourcedListField } from "./SourcedField";

describe("SourcedField", () => {
  it("renders the value and a source link when present", () => {
    render(
      <SourcedField label="Mức lương" field={{ value: "15-25 triệu", source: "https://example.com" }} />
    );
    expect(screen.getByText("15-25 triệu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nguồn" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
  });

  it("renders the fallback text and no link when value is null", () => {
    render(<SourcedField label="Nhu cầu" field={{ value: null, source: null }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("SourcedListField", () => {
  it("renders each list item", () => {
    render(
      <SourcedListField
        label="Skill tương lai"
        field={{ value: ["Python", "AI/ML cơ bản"], source: null }}
      />
    );
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("AI/ML cơ bản")).toBeInTheDocument();
  });

  it("renders the fallback text when value is null", () => {
    render(<SourcedListField label="Skill tương lai" field={{ value: null, source: null }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
  });
});
