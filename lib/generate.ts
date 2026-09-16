import { searchTavily, type SearchResultItem } from "./tavily";
import { completeWithDeepSeek } from "./deepseek";
import type { JobContent } from "@/types/job-content";
import trustedSources from "@/data/trusted-sources.json";

function computeStartDate(maxAgeYears: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - maxAgeYears);
  return date.toISOString().slice(0, 10);
}

const SYSTEM_PROMPT = `Bạn là trợ lý tổng hợp thông tin nghề nghiệp cho thị trường Việt Nam.
Chỉ được dùng thông tin có trong các đoạn trích dẫn được cung cấp — không được bịa số liệu.
Nếu một mục không tìm thấy thông tin đủ tin cậy trong các đoạn trích dẫn, để giá trị "value"
là null và "source" là null thay vì suy đoán.
Trả lời DUY NHẤT bằng JSON hợp lệ theo đúng schema được yêu cầu, không thêm giải thích.`;

function buildUserPrompt(jobTitle: string, searchResults: SearchResultItem[]): string {
  const sourcesBlock = searchResults
    .map((r, i) => `[Nguồn ${i + 1}] ${r.title} (${r.url})\n${r.content}`)
    .join("\n\n");

  return `Nghề: ${jobTitle}

Các đoạn trích dẫn tìm được:
${sourcesBlock}

Hãy trả về JSON theo schema sau:
{
  "description": string,
  "vnMarket": { "value": string | null, "source": string | null },
  "salary": { "value": string | null, "source": string | null },
  "demand": { "value": string | null, "source": string | null },
  "similarJobs": [{ "name": string, "distinction": string }],
  "hardSkills": [{ "name": string, "description": string }],
  "softSkills": [{ "name": string, "description": string }],
  "futureSkills": { "value": string[] | null, "source": string | null },
  "careerPath": [{ "stageName": string, "keySkills": string[], "salaryRange": { "value": string | null, "source": string | null }, "avgTimeToNextStage": string }]
}

"source" phải là tên nguồn cụ thể lấy từ danh sách trích dẫn ở trên (ví dụ "Nguồn 1"), không phải mô tả chung chung.`;
}

export class GenerationError extends Error {}

export async function generateJobContent(jobTitle: string): Promise<JobContent> {
  const searchResults = await searchTavily(
    `${jobTitle} lương kỹ năng thị trường việc làm Việt Nam`,
    {
      includeDomains: trustedSources.domains,
      startDate: computeStartDate(trustedSources.maxAgeYears),
    }
  );

  if (searchResults.length === 0) {
    throw new GenerationError(
      `Không tìm thấy nguồn uy tín (trong ${trustedSources.maxAgeYears} năm gần đây) cho "${jobTitle}"`
    );
  }

  const userPrompt = buildUserPrompt(jobTitle, searchResults);
  const rawResponse = await completeWithDeepSeek(SYSTEM_PROMPT, userPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new GenerationError("DeepSeek trả về JSON không hợp lệ");
  }

  return validateAndNormalizeContent(parsed, searchResults);
}

function resolveSource(
  sourceLabel: string | null | undefined,
  searchResults: SearchResultItem[]
): string | null {
  if (!sourceLabel) return null;
  const match = sourceLabel.match(/Nguồn (\d+)/);
  if (!match) return null;
  const index = parseInt(match[1], 10) - 1;
  return searchResults[index]?.url ?? null;
}

interface RawSourcedField {
  value?: unknown;
  source?: string | null;
}

interface RawCareerStage {
  stageName?: string;
  keySkills?: string[];
  salaryRange?: RawSourcedField;
  avgTimeToNextStage?: string;
}

interface RawJobContent {
  description?: string;
  vnMarket?: RawSourcedField;
  salary?: RawSourcedField;
  demand?: RawSourcedField;
  similarJobs?: JobContent["similarJobs"];
  hardSkills?: JobContent["hardSkills"];
  softSkills?: JobContent["softSkills"];
  futureSkills?: RawSourcedField;
  careerPath?: RawCareerStage[];
}

function sourcedField<T>(
  field: RawSourcedField | undefined,
  searchResults: SearchResultItem[]
): { value: T | null; source: string | null } {
  const resolvedSource = resolveSource(field?.source, searchResults);
  if (!resolvedSource) {
    return { value: null, source: null };
  }
  return { value: (field?.value as T | undefined) ?? null, source: resolvedSource };
}

function validateAndNormalizeContent(
  parsed: unknown,
  searchResults: SearchResultItem[]
): JobContent {
  const obj = parsed as RawJobContent;

  return {
    description: obj.description ?? "",
    vnMarket: sourcedField(obj.vnMarket, searchResults),
    salary: sourcedField(obj.salary, searchResults),
    demand: sourcedField(obj.demand, searchResults),
    similarJobs: obj.similarJobs ?? [],
    hardSkills: obj.hardSkills ?? [],
    softSkills: obj.softSkills ?? [],
    futureSkills: sourcedField(obj.futureSkills, searchResults),
    careerPath: (obj.careerPath ?? []).map((stage) => ({
      stageName: stage.stageName ?? "",
      keySkills: stage.keySkills ?? [],
      salaryRange: sourcedField(stage.salaryRange, searchResults),
      avgTimeToNextStage: stage.avgTimeToNextStage ?? "",
    })),
  };
}
