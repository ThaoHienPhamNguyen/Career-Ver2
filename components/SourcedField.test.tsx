// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourcedField } from "./SourcedField";

describe("SourcedField", () => {
  it("renders the value and a source link when present", () => {
    render(
      <SourcedField label="Mức lương" field={{ value: "15-25 triệu", source: "https://example.com" }} />
    );
    expect(screen.getByText("15-25 triệu")).toBeInTheDocument();
    expect(screen.getByText("Nguồn: example.com")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders the fallback text and no source when value is null", () => {
    render(<SourcedField label="Nhu cầu" field={{ value: null, source: null }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
    expect(screen.queryByText(/Nguồn:/)).not.toBeInTheDocument();
  });

  it("renders no source when value is null even if a source is present", () => {
    render(<SourcedField label="Nhu cầu" field={{ value: null, source: "https://example.com" }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
    expect(screen.queryByText(/Nguồn:/)).not.toBeInTheDocument();
    expect(screen.queryByText("https://example.com")).not.toBeInTheDocument();
  });
});
