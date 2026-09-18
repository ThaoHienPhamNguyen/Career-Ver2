import { describe, it, expect } from "vitest";
import { extractSalaryHeadline, extractDemandHeadline, parseSalaryMidpoint } from "./market-tags";

describe("extractSalaryHeadline", () => {
  it("extracts a Vietnamese range with unit and period", () => {
    expect(
      extractSalaryHeadline(
        "Theo cẩm nang lương của CareerLink, dao động khoảng 7-10 triệu/tháng ở cấp Fresher, 10-15 triệu ở Junior."
      )
    ).toBe("7-10 triệu/tháng");
  });

  it("extracts an English range with VND unit", () => {
    expect(extractSalaryHeadline("Fresher/entry-level: 10-15 million VND/month. Analyst: 15-25 million VND/month.")).toBe(
      "10-15 million VND/month"
    );
  });

  it("extracts a single figure with đồng unit when no triệu/million word is present", () => {
    expect(
      extractSalaryHeadline("Mức lương trung bình khoảng 8.164.000 đồng/tháng, dao động phổ biến từ 5.002.000 - 13.325.000 đồng/tháng.")
    ).toBe("8.164.000 đồng/tháng");
  });

  it("returns null when the value is null", () => {
    expect(extractSalaryHeadline(null)).toBeNull();
  });

  it("returns null when no salary figure can be found", () => {
    expect(extractSalaryHeadline("Không có dữ liệu lương cụ thể cho vị trí này.")).toBeNull();
  });
});

describe("parseSalaryMidpoint", () => {
  it("averages a range", () => {
    expect(parseSalaryMidpoint("7-10 triệu/tháng")).toBe(8.5);
  });

  it("returns the single figure as-is when there is no range", () => {
    expect(parseSalaryMidpoint("15 triệu/tháng")).toBe(15);
  });

  it("returns null for null input", () => {
    expect(parseSalaryMidpoint(null)).toBeNull();
  });

  it("returns null when no number is present", () => {
    expect(parseSalaryMidpoint("Chưa có dữ liệu")).toBeNull();
  });
});

describe("extractDemandHeadline", () => {
  it("returns a hot 'Cao' tag for a positive % tied to hiring demand", () => {
    expect(
      extractDemandHeadline(
        "Kế toán/Kiểm toán là nhóm ngành có mức tăng trưởng tuyển dụng mạnh nhất toàn thị trường, đạt +56,7% so với cùng kỳ Quý 2/2025."
      )
    ).toEqual({ text: "Cao", tone: "hot" });
  });

  it("returns a cool 'Thấp' tag for a declining % tied to hiring demand", () => {
    expect(
      extractDemandHeadline(
        "Theo báo cáo, nhu cầu tuyển dụng ngành Kinh doanh/Bán hàng giảm nhẹ 3,3% so với cùng kỳ Quý 2/2025."
      )
    ).toEqual({ text: "Thấp", tone: "cool" });
  });

  it("returns a hot 'Cao' tag from a job-posting count when nearby wording signals high demand", () => {
    expect(
      extractDemandHeadline(
        "VietnamWorks hiện có hơn 660 việc làm Project Manager đang tuyển, cho thấy nhu cầu tuyển dụng vị trí này vẫn ở mức cao."
      )
    ).toEqual({ text: "Cao", tone: "hot" });
  });

  it("ignores a % figure that isn't about hiring demand, falling back to a qualitative label", () => {
    // The 15-30% here is a pay premium, not a demand change — must not be read as "Tăng 15-30%".
    // The text still says "dẫn đầu nhu cầu" though, so the qualitative fallback should read "Cao".
    expect(
      extractDemandHeadline(
        "Các doanh nghiệp đang dẫn đầu nhu cầu tuyển content writer am hiểu công cụ AI, với mức thu nhập cao hơn khoảng 15-30% so với content writer truyền thống cùng mức kinh nghiệm."
      )
    ).toEqual({ text: "Cao", tone: "hot" });
  });

  it("returns a short 'Thấp' label when the text signals candidate oversupply", () => {
    expect(
      extractDemandHeadline(
        "Mức độ cạnh tranh ứng viên cao hơn đáng kể so với quy mô tuyển dụng, tức nguồn cung lao động vượt khá xa số vị trí tuyển dụng thực tế."
      )
    ).toEqual({ text: "Thấp", tone: "cool" });
  });

  it("returns a short 'Ổn định' label as the last-resort fallback, never a raw sentence", () => {
    const result = extractDemandHeadline(
      "Theo CareerLink, ngành content tại Việt Nam đang chuyển dịch nhanh cùng làn sóng ứng dụng AI."
    );
    expect(result).toEqual({ text: "Ổn định", tone: "neutral" });
  });

  it("returns null when the value is null", () => {
    expect(extractDemandHeadline(null)).toBeNull();
  });
});
