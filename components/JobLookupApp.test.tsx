// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobLookupApp } from "./JobLookupApp";
import * as actionsModule from "@/app/actions";
import type { JobContent } from "@/types/job-content";
import type { LookupResult } from "@/lib/lookup";

vi.mock("@/app/actions", () => ({
  lookupJobAction: vi.fn(),
}));

const SAMPLE_CONTENT: JobContent = {
  description: "Mô tả mẫu",
  vnMarket: { value: null, source: null },
  salary: { value: null, source: null },
  demand: { value: null, source: null },
  hiringCompanies: { value: null, source: null },
  similarJobs: [],
  hardSkills: [],
  softSkills: [],
  futureSkills: [],
  careerPath: [],
};

const SEARCH_PLACEHOLDER = "Nhập tên nghề, ví dụ: Data Analyst";

describe("JobLookupApp", () => {
  beforeEach(() => {
    vi.mocked(actionsModule.lookupJobAction).mockReset();
  });

  it("shows the idle screen with hero, search form, and reason cards", () => {
    render(<JobLookupApp />);
    expect(screen.getByText("Career Hub — hiểu nghề, chọn đúng hướng")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText("4 điều Career Hub mang lại cho bạn")).toBeInTheDocument();
  });

  it("shows the continuous loading screen while searching, then swaps to the result screen", async () => {
    let resolveAction!: (value: LookupResult) => void;
    const pending = new Promise<LookupResult>((resolve) => {
      resolveAction = resolve;
    });
    vi.mocked(actionsModule.lookupJobAction).mockReturnValue(pending);

    const user = userEvent.setup();
    render(<JobLookupApp />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "data analyst");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    expect(
      screen.getByText("AI đang suy nghĩ kỹ lắm rồi, chờ xíu nha!")
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();

    resolveAction({
      status: "found",
      canonicalName: "Data Analyst",
      source: "seed",
      content: SAMPLE_CONTENT,
    });

    await waitFor(() => {
      expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("AI đang suy nghĩ kỹ lắm rồi, chờ xíu nha!")
    ).not.toBeInTheDocument();
  });

  it("renders candidate buttons for an ambiguous result and re-searches (through loading again) on click", async () => {
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
    render(<JobLookupApp />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "BA");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    const candidateButton = await screen.findByRole("button", { name: "Business Analyst" });
    await user.click(candidateButton);

    await waitFor(() => {
      expect(screen.getAllByText("Business Analyst").length).toBeGreaterThan(0);
    });
    expect(actionsModule.lookupJobAction).toHaveBeenLastCalledWith("Business Analyst");
  });

  it("renders the error message when generation fails", async () => {
    vi.mocked(actionsModule.lookupJobAction).mockResolvedValue({
      status: "generation_failed",
      message: 'Không tìm thấy nguồn nào cho "Nghề Lạ"',
    });

    const user = userEvent.setup();
    render(<JobLookupApp />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "Nghề Lạ");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy nguồn nào cho "Nghề Lạ"')).toBeInTheDocument();
    });
  });

  it("shows a friendly error and lets the user go back to idle when the action rejects", async () => {
    vi.mocked(actionsModule.lookupJobAction).mockRejectedValue(new Error("boom"));

    const user = userEvent.setup();
    render(<JobLookupApp />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "Data Analyst");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    await waitFor(() => {
      expect(
        screen.getByText("Có lỗi xảy ra khi tra cứu, vui lòng thử lại sau")
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "← Tra cứu nghề khác" }));

    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
    expect(
      screen.queryByText("Có lỗi xảy ra khi tra cứu, vui lòng thử lại sau")
    ).not.toBeInTheDocument();
  });

  it("returns to the idle screen from a found result via the back button", async () => {
    vi.mocked(actionsModule.lookupJobAction).mockResolvedValue({
      status: "found",
      canonicalName: "Data Analyst",
      source: "seed",
      content: SAMPLE_CONTENT,
    });

    const user = userEvent.setup();
    render(<JobLookupApp />);

    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), "Data Analyst");
    await user.click(screen.getByRole("button", { name: "Tra cứu" }));

    await waitFor(() => {
      expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "← Tra cứu nghề khác" }));

    expect(screen.getByText("4 điều Career Hub mang lại cho bạn")).toBeInTheDocument();
  });
});
