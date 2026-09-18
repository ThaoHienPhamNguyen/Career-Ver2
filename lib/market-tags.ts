export type DemandTone = "hot" | "cool" | "neutral";

export interface DemandHeadline {
  text: string;
  tone: DemandTone;
}

const SALARY_UNIT = "(?:triệu|million|đồng|VNĐ|VND)";
const SALARY_RE = new RegExp(
  `\\d[\\d.,]*\\+?(?:\\s*[-–]\\s*\\d[\\d.,]*\\+?)?\\s*${SALARY_UNIT}(?:\\s*(?:đồng|VNĐ|VND))?(?:\\s*\\/\\s*(?:tháng|month))?`,
  "i"
);

/** Extract a short "N triệu/tháng"-style headline from a long, citation-heavy salary sentence. */
export function extractSalaryHeadline(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(SALARY_RE);
  return match ? match[0].trim() : null;
}

/** Midpoint of a "7-10 triệu/tháng"-style range (or the single figure), for charting only. */
export function parseSalaryMidpoint(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?/);
  if (!match) return null;
  const toNumber = (raw: string) => parseFloat(raw.replace(",", "."));
  const first = toNumber(match[1]);
  const second = match[2] ? toNumber(match[2]) : first;
  return (first + second) / 2;
}

const DEMAND_PERCENT_RE = /([+-]?)\s*(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*%/g;
const DEMAND_CONTEXT_RE = /(nhu cầu|tuyển dụng|demand|hiring|recruitment|growth|tăng trưởng|cùng kỳ|yoy|year-over-year)/i;
const GROWING_RE = /(tăng|grew|grow|growth|increase)/i;
const DECLINING_RE = /(giảm|declin|fell|drop|decrease)/i;
const JOB_COUNT_RE = /(\d+)\s*(việc làm|vị trí|tin tuyển dụng)/i;
const HOT_COUNT_CONTEXT_RE = /(cao|mạnh|tăng|nhiều)/i;
const LOW_DEMAND_RE = /(cạnh tranh ứng viên cao|nguồn cung lao động[^.]*vượt|dư thừa lao động|thu hẹp tuyển dụng|oversupply|declining demand)/i;
const HIGH_DEMAND_RE = /(săn đón|dẫn đầu nhu cầu|đứng thứ|top các vị trí|mạnh nhất|nhu cầu lớn|khan hiếm nhân lực|cơ hội việc làm rộng mở|highly sought|most sought|in high demand|strong demand)/i;
const CONTEXT_WINDOW_BEFORE = 70;
const CONTEXT_WINDOW_AFTER = 15;

/**
 * Extract a compact, consistent demand headline — always one of Cao/Ổn định/Thấp — derived
 * from whichever signal is available: a % change near hiring-demand wording, a job-posting
 * count, or qualitative wording in the source text. Never a raw number or truncated sentence,
 * so the tag reads the same way regardless of which signal produced it.
 */
export function extractDemandHeadline(value: string | null): DemandHeadline | null {
  if (!value) return null;

  DEMAND_PERCENT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DEMAND_PERCENT_RE.exec(value))) {
    const windowStart = Math.max(0, match.index - CONTEXT_WINDOW_BEFORE);
    const windowEnd = Math.min(value.length, match.index + match[0].length + CONTEXT_WINDOW_AFTER);
    const window = value.slice(windowStart, windowEnd);
    if (!DEMAND_CONTEXT_RE.test(window)) continue;

    const [, sign] = match;
    const growing = sign === "+" || GROWING_RE.test(window);
    const declining = sign === "-" || DECLINING_RE.test(window);
    if (growing && !declining) return { text: "Cao", tone: "hot" };
    if (declining && !growing) return { text: "Thấp", tone: "cool" };
    return { text: "Ổn định", tone: "neutral" };
  }

  const countMatch = value.match(JOB_COUNT_RE);
  if (countMatch) {
    const tone: DemandTone = HOT_COUNT_CONTEXT_RE.test(value) ? "hot" : "neutral";
    return { text: tone === "hot" ? "Cao" : "Ổn định", tone };
  }

  if (LOW_DEMAND_RE.test(value)) return { text: "Thấp", tone: "cool" };
  if (HIGH_DEMAND_RE.test(value)) return { text: "Cao", tone: "hot" };
  return { text: "Ổn định", tone: "neutral" };
}
