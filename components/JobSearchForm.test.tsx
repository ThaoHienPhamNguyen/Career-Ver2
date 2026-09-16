// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobSearchForm } from "./JobSearchForm";
import * as actionsModule from "@/app/actions";
import type { JobContent } from "@/types/job-content";

vi.mock("@/app/actions", () => ({
  lookupJobAction: vi.fn(),
}));

const SAMPLE_CONTENT: JobContent = {
  description: "Mô tả mẫu",
  vnMarket: { value: null, source: null },
  salary: { value: null, source: null },
  demand: { value: null, source: null },
  similarJobs: [],
  hardSkills: [],
  softSkills: [],
  futureSkills: { value: null, source: null },
  careerPath: [],
};

describe("JobSearchForm", () => {
  beforeEach(() => {
    vi.mocked(actionsModule.lookupJobAction).mockReset();
  });

  it("submits the input and renders the found result", async () => {
    vi.mocked(actionsModule.lookupJobAction).mockResolvedValue({
      status: "found",
      canonicalName: "Data Analyst",
      source: "seed",
      content: SAMPLE_CONTENT,
    });

    const user = userEvent.setup();
    render(<JobSearchForm />);

    await user.type(screen.getByPlaceholderText("Nhập tên nghề, ví dụ: Data Analyst"), "data analyst");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(actionsModule.lookupJobAction).toHaveBeenCalledWith("data analyst");
    await waitFor(() => {
      expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    });
  });

  it("renders candidate buttons for an ambiguous result and re-searches on click", async () => {
    vi.mocked(actionsModule.lookupJobAction)
      .mockResolvedValueOnce({
        status: "ambiguous",
        candidates: ["Business Analyst", "Backend Developer"],
      })
      .mockResolvedValueOnce({
        status: "found",
        canonicalName: "Business Analyst",
        source: "generated",
        content: SAMPLE_CONTENT,
      });

    const user = userEvent.setup();
    render(<JobSearchForm />);

    await user.type(screen.getByPlaceholderText("Nhập tên nghề, ví dụ: Data Analyst"), "BA");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    const candidateButton = await screen.findByRole("button", { name: "Business Analyst" });
    await user.click(candidateButton);

    expect(actionsModule.lookupJobAction).toHaveBeenLastCalledWith("Business Analyst");
    await waitFor(() => {
      expect(screen.getAllByText("Business Analyst").length).toBeGreaterThan(0);
    });
  });

  it("renders the error message when generation fails", async () => {
    vi.mocked(actionsModule.lookupJobAction).mockResolvedValue({
      status: "generation_failed",
      message: 'Không tìm thấy nguồn nào cho "Nghề Lạ"',
    });

    const user = userEvent.setup();
    render(<JobSearchForm />);

    await user.type(screen.getByPlaceholderText("Nhập tên nghề, ví dụ: Data Analyst"), "Nghề Lạ");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy nguồn nào cho "Nghề Lạ"')).toBeInTheDocument();
    });
  });
});
