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
  hiringCompanies: {
    value: [{ name: "FPT Software", domain: "fpt-software.com" }],
    source: "https://example.com/jobs",
  },
  similarJobs: [{ name: "Business Analyst", distinction: "Thiên về nghiệp vụ hơn kỹ thuật" }],
  hardSkills: [{ name: "SQL", description: "Truy vấn và xử lý dữ liệu quan hệ" }],
  softSkills: [{ name: "Giao tiếp", description: "Trình bày insight cho người không chuyên" }],
  futureSkills: [
    {
      name: "Python",
      label: "critical",
      description: "Ngôn ngữ chính cho xử lý và phân tích dữ liệu quy mô lớn.",
      quote: { text: "Data literacy is the new baseline", author: "Jane Doe, CDO" },
      source: "https://example.com/report",
    },
    {
      name: "AI/ML cơ bản",
      label: "emerging",
      description: "Hiểu nguyên lý cơ bản để ứng dụng mô hình AI/ML vào phân tích.",
      quote: null,
      source: null,
    },
  ],
  careerPath: [
    {
      stageName: "Fresher",
      keySkills: ["Excel", "Power BI cơ bản"],
      salaryRange: { value: "10-15 triệu", source: "https://example.com/salary" },
      avgTimeToNextStage: "1-2 năm",
    },
    {
      stageName: "Junior",
      keySkills: ["SQL nâng cao"],
      salaryRange: { value: "15-20 triệu", source: "https://example.com/salary" },
      avgTimeToNextStage: "1-2 năm",
    },
  ],
};

describe("JobResultView", () => {
  it("renders the job title and description", () => {
    render(<JobResultView canonicalName="Data Analyst" content={SAMPLE_CONTENT} />);
    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    expect(
      screen.getByText("Thu thập, xử lý và phân tích dữ liệu để hỗ trợ ra quyết định kinh doanh.")
    ).toBeInTheDocument();
  });

  it("renders hiring companies, both skill columns, future skills with quote, and career path stages without any click", () => {
    render(<JobResultView canonicalName="Data Analyst" content={SAMPLE_CONTENT} />);
    expect(screen.getByText("FPT Software")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Giao tiếp")).toBeInTheDocument();
    expect(screen.getByText("Cần ngay")).toBeInTheDocument();
    expect(
      screen.getByText("Ngôn ngữ chính cho xử lý và phân tích dữ liệu quy mô lớn.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Data literacy is the new baseline/)).toBeInTheDocument();
    expect(screen.getAllByText("Fresher").length).toBeGreaterThan(0);
    expect(screen.getByText("Excel")).toBeInTheDocument();
    expect(screen.getByText("1-2 năm")).toBeInTheDocument();
  });

  it("does not render the similar-jobs section (parked for a later iteration)", () => {
    render(<JobResultView canonicalName="Data Analyst" content={SAMPLE_CONTENT} />);
    expect(screen.queryByText("Ngành dễ nhầm lẫn")).not.toBeInTheDocument();
  });

  it("renders the no-verified-data fallback for a null field", () => {
    render(<JobResultView canonicalName="Data Analyst" content={SAMPLE_CONTENT} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
  });

  it("renders the no-verified-data fallback for empty description, arrays, and career-path fields", () => {
    const EMPTY_CONTENT: JobContent = {
      description: "",
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
    render(<JobResultView canonicalName="Data Analyst" content={EMPTY_CONTENT} />);
    const fallbackTexts = screen.getAllByText("Chưa có dữ liệu xác thực");
    // description, hiringCompanies, skills matrix (hard+soft combined), futureSkills, careerPath
    expect(fallbackTexts.length).toBeGreaterThanOrEqual(5);
  });
});
