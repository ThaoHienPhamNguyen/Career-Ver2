import { searchTavily, type SearchResultItem } from "./tavily";
import { completeWithOpenAI } from "./openai";
import { extractFirstJsonValue } from "./extract-json";
import type {
  JobContent,
  JobSource,
  HiringCompany,
  FutureSkillItem,
  FutureSkillLabel,
} from "@/types/job-content";
import trustedSources from "@/data/trusted-sources.json";

type GeneratedSource = Extract<JobSource, "generated" | "generated_extended">;

const FUTURE_SKILL_LABELS: FutureSkillLabel[] = ["critical", "important", "emerging", "watch"];

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
  "hiringCompanies": { "value": [{ "name": string, "domain": string }] | null, "source": string | null },
  "similarJobs": [{ "name": string, "distinction": string }],
  "hardSkills": [{ "name": string, "description": string }],
  "softSkills": [{ "name": string, "description": string }],
  "futureSkills": [{ "name": string, "label": "critical" | "important" | "emerging" | "watch", "description": string, "quote": { "text": string, "author": string } | null, "source": string | null }],
  "careerPath": [{ "stageName": string, "keySkills": string[], "salaryRange": { "value": string | null, "source": string | null }, "avgTimeToNextStage": string }]
}

"source" phải là tên nguồn cụ thể lấy từ danh sách trích dẫn ở trên (ví dụ "Nguồn 1"), không phải mô tả chung chung.

Hướng dẫn riêng cho "hiringCompanies": đây là các công ty được nêu tên rõ ràng trong các đoạn
trích dẫn là CÓ vị trí này trong tổ chức của họ (không nhất thiết đang tuyển ngay lúc này) —
"domain" là tên miền website chính thức của công ty đó (để lấy logo), chỉ điền khi bạn chắc chắn;
nếu trích dẫn không nêu tên công ty cụ thể nào, để "value" là null.

Hướng dẫn riêng cho "futureSkills": "label" do bạn tự đánh giá mức độ cấp thiết dựa trên nội dung
trích dẫn ("critical" = cần ngay, "important" = cần sớm, "emerging" = đang nổi lên, "watch" = nên
theo dõi). "description" là 1-2 câu giải thích kỹ kỹ năng này là gì và vì sao nó quan trọng với
nghề này — tự viết dựa trên hiểu biết chung, không cần trích dẫn riêng cho câu giải thích. "quote"
chỉ điền khi trích dẫn có một câu nói/nhận định cụ thể kèm tên người nói hoặc tên báo cáo — chép
đúng nguyên văn, không tự đặt câu quote hay tự gán tên tác giả; nếu không có thì để "quote" là null.`;
}

export class GenerationError extends Error {}

export async function generateJobContent(
  jobTitle: string
): Promise<{ content: JobContent; source: GeneratedSource }> {
  const query = `${jobTitle} lương kỹ năng thị trường việc làm Việt Nam`;
  const startDate = computeStartDate(trustedSources.maxAgeYears);

  let searchResults = await searchTavily(query, {
    includeDomains: trustedSources.domains,
    startDate,
  });
  let source: GeneratedSource = "generated";

  if (searchResults.length === 0) {
    // Trusted domains had nothing — fall back to an unrestricted search rather than
    // failing outright, so any job title can still get a full result. The result is
    // tagged "generated_extended" so the UI can show it as a lower-trust tier than
    // content backed by the curated source list.
    searchResults = await searchTavily(query, { startDate });
    source = "generated_extended";
  }

  if (searchResults.length === 0) {
    throw new GenerationError(`Không tìm thấy nguồn nào cho "${jobTitle}"`);
  }

  const userPrompt = buildUserPrompt(jobTitle, searchResults);
  const rawResponse = await completeWithOpenAI(SYSTEM_PROMPT, userPrompt);
  const parsed = parseModelJson(rawResponse);

  return { content: validateAndNormalizeContent(parsed, searchResults), source };
}

function parseModelJson(rawResponse: string): unknown {
  try {
    return JSON.parse(rawResponse);
  } catch {
    const extracted = extractFirstJsonValue(rawResponse);
    if (extracted) {
      try {
        return JSON.parse(extracted);
      } catch {
        // fall through to the error below
      }
    }
    throw new GenerationError("OpenAI trả về JSON không hợp lệ");
  }
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

interface RawFutureSkill {
  name?: string;
  label?: string;
  description?: string;
  quote?: { text?: string; author?: string } | null;
  source?: string | null;
}

interface RawJobContent {
  description?: string;
  vnMarket?: RawSourcedField;
  salary?: RawSourcedField;
  demand?: RawSourcedField;
  hiringCompanies?: RawSourcedField;
  similarJobs?: JobContent["similarJobs"];
  hardSkills?: JobContent["hardSkills"];
  softSkills?: JobContent["softSkills"];
  futureSkills?: RawFutureSkill[];
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

function normalizeFutureSkill(
  raw: RawFutureSkill,
  searchResults: SearchResultItem[]
): FutureSkillItem | null {
  if (!raw?.name) return null;
  const label = FUTURE_SKILL_LABELS.includes(raw.label as FutureSkillLabel)
    ? (raw.label as FutureSkillLabel)
    : "watch";
  const quote =
    raw.quote?.text && raw.quote?.author ? { text: raw.quote.text, author: raw.quote.author } : null;
  return {
    name: raw.name,
    label,
    description: raw.description ?? "",
    quote,
    source: resolveSource(raw.source, searchResults),
  };
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
    hiringCompanies: sourcedField<HiringCompany[]>(obj.hiringCompanies, searchResults),
    similarJobs: obj.similarJobs ?? [],
    hardSkills: obj.hardSkills ?? [],
    softSkills: obj.softSkills ?? [],
    futureSkills: (obj.futureSkills ?? [])
      .map((skill) => normalizeFutureSkill(skill, searchResults))
      .filter((skill): skill is FutureSkillItem => skill !== null),
    careerPath: (obj.careerPath ?? []).map((stage) => ({
      stageName: stage.stageName ?? "",
      keySkills: stage.keySkills ?? [],
      salaryRange: sourcedField(stage.salaryRange, searchResults),
      avgTimeToNextStage: stage.avgTimeToNextStage ?? "",
    })),
  };
}
