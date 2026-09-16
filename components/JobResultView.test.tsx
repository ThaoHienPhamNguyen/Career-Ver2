// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobResultView } from "./JobResultView";
import type { JobContent } from "@/types/job-content";

const SAMPLE_CONTENT: JobContent = {
  description: "Thu thập, xử lý và phân tích dữ liệu để hỗ trợ ra quyết định kinh doanh.",
  vnMarket: { value: "Nhu cầu tăng mạnh", source: "https://example.com/market" },
  salary: { value: "15-25 triệu", source: "https://example.com/salary" },
  demand: { value: null, source: null },
  similarJobs: [{ name: "Business Analyst", distinction: "Thiên về nghiệp vụ hơn kỹ thuật" }],
  hardSkills: [{ name: "SQL", description: "Truy vấn và xử lý dữ liệu quan hệ" }],
  softSkills: [{ name: "Giao tiếp", description: "Trình bày insight cho người không chuyên" }],
  futureSkills: { value: ["Python", "AI/ML cơ bản"], source: null },
  careerPath: [
    {
      stageName: "Fresher",
      keySkills: ["Excel", "Power BI cơ bản"],
      salaryRange: { value: "10-15 triệu", source: "https://example.com/salary" },
      avgTimeToNextStage: "1-2 năm",
    },
  ],
};

describe("JobResultView", () => {
  it("renders the job title, badge, and description", () => {
    render(<JobResultView canonicalName="Data Analyst" source="seed" content={SAMPLE_CONTENT} />);
    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.getByText("Đã đối chiếu nguồn")).toBeInTheDocument();
    expect(
      screen.getByText("Thu thập, xử lý và phân tích dữ liệu để hỗ trợ ra quyết định kinh doanh.")
    ).toBeInTheDocument();
  });

  it("renders similar jobs, skills, and career path stages", () => {
    render(
      <JobResultView canonicalName="Data Analyst" source="generated" content={SAMPLE_CONTENT} />
    );
    expect(screen.getByText("Business Analyst", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("SQL", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Giao tiếp", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Fresher")).toBeInTheDocument();
    expect(screen.getByText("10-15 triệu")).toBeInTheDocument();
  });

  it("renders the no-verified-data fallback for a null field", () => {
    render(<JobResultView canonicalName="Data Analyst" source="seed" content={SAMPLE_CONTENT} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
  });

  it("renders the no-verified-data fallback for empty description, arrays, and career-path fields", () => {
    const EMPTY_CONTENT: JobContent = {
      description: "",
      vnMarket: { value: null, source: null },
      salary: { value: null, source: null },
      demand: { value: null, source: null },
      similarJobs: [],
      hardSkills: [],
      softSkills: [],
      futureSkills: { value: [], source: "https://example.com" },
      careerPath: [],
    };
    render(<JobResultView canonicalName="Data Analyst" source="seed" content={EMPTY_CONTENT} />);
    const fallbackTexts = screen.getAllByText("Chưa có dữ liệu xác thực");
    // description, vnMarket, salary, demand, futureSkills, similarJobs, hardSkills, softSkills, careerPath
    expect(fallbackTexts.length).toBeGreaterThanOrEqual(9);
  });
});
