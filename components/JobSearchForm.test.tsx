// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobSearchForm } from "./JobSearchForm";

describe("JobSearchForm", () => {
  it("calls onSubmit with the trimmed input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<JobSearchForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("Nhập tên nghề, ví dụ: Data Analyst"),
      "  data analyst  "
    );
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(onSubmit).toHaveBeenCalledWith("data analyst");
  });

  it("does not call onSubmit for empty input", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<JobSearchForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders suggested job chips and searches that job on click", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<JobSearchForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Data Analyst" }));

    expect(onSubmit).toHaveBeenCalledWith("Data Analyst");
  });
});
