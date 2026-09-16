# Career Job Lookup — Data Layer & Generation Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend "brain" of the career job lookup tool — normalize/match job title input, check a seed set or cache, and generate cited content via Tavily search + DeepSeek when nothing exists yet. Fully testable via scripts, no UI required.

**Architecture:** Next.js project (App Router, TypeScript) used purely as the app shell for now; all logic lives in framework-agnostic `lib/` modules with a Prisma/PostgreSQL persistence layer. A single orchestration function (`lookupJob`) ties normalization → canonical matching → cache lookup → on-demand generation together.

**Tech Stack:** Next.js (TypeScript), Prisma + PostgreSQL (Supabase free tier), Vitest, DeepSeek API (LLM), Tavily API (web search), `fastest-levenshtein` (fuzzy matching).

**Spec:** `docs/superpowers/specs/2026-09-16-career-job-lookup-design.md`

## Global Constraints

- Mọi giá trị số liệu (lương, thị trường, nhu cầu, xu hướng) mà không resolve được về một nguồn trích dẫn thật trong kết quả search → giá trị và nguồn đều phải là `null` (spec §4, §6) — không hiển thị số liệu không có căn cứ.
- Không crawl JD tuyển dụng trực tiếp từ bất kỳ trang nào — chỉ dùng Tavily search + DeepSeek synthesis (spec §5, §8, §9).
- Kiến trúc phải chạy được bởi 1 người, part-time — generate-on-demand + cache, không có crawler/queue chạy nền (spec §6, §10).
- Job title mơ hồ (nhiều khả năng khớp) phải được hỏi lại người dùng, không tự đoán (spec §6).

---

### Task 1: Scaffold dự án Next.js + TypeScript + Tailwind + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `lib/env.ts`
- Test: `lib/env.test.ts`

**Interfaces:**
- Produces: `getRequiredEnv(name: string): string` — throws if the env var is missing. Every later task that calls an external API (Tavily, DeepSeek, DB) uses this to read its API key/connection string.

- [ ] **Step 1: Scaffold the Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm
```

Nếu bị hỏi tương tác, chọn giá trị mặc định cho mọi câu hỏi.

- [ ] **Step 2: Cài Vitest**

```bash
npm install -D vitest
```

Thêm vào `package.json` (`scripts`):

```json
"test": "vitest run"
```

- [ ] **Step 3: Tạo `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Tạo `.env.example` và `.gitignore` entry**

`.env.example`:

```
DATABASE_URL=
TAVILY_API_KEY=
DEEPSEEK_API_KEY=
```

Thêm `.env` vào `.gitignore` (create-next-app thường đã có sẵn, kiểm tra lại).

- [ ] **Step 5: Viết failing test cho `lib/env.ts`**

`lib/env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getRequiredEnv } from "./env";

describe("getRequiredEnv", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns the value when the env var is set", () => {
    process.env.TEST_VAR = "hello";
    expect(getRequiredEnv("TEST_VAR")).toBe("hello");
  });

  it("throws a descriptive error when the env var is missing", () => {
    delete process.env.TEST_VAR;
    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR"
    );
  });
});
```

- [ ] **Step 6: Chạy test, xác nhận fail**

Run: `npx vitest run lib/env.test.ts`
Expected: FAIL — `Cannot find module './env'`

- [ ] **Step 7: Viết `lib/env.ts`**

```typescript
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

- [ ] **Step 8: Chạy test, xác nhận pass**

Run: `npx vitest run lib/env.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest and env helper"
```

---

### Task 2: Prisma schema + kết nối Supabase

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`
- Test: `lib/db.test.ts`

**Interfaces:**
- Consumes: `getRequiredEnv` (Task 1, via `DATABASE_URL` set in `.env`, read implicitly by Prisma).
- Produces: `prisma: PrismaClient` singleton, and the `JobTitle` model (`canonicalName`, `source`, `content`, `viewCount`) — every later task touching persistence imports `prisma` from `lib/db.ts`.

- [ ] **Step 1: Tạo project Supabase (thủ công, ngoài code)**

Vào supabase.com → New project (free tier) → Settings → Database → copy connection string (chế độ "Connection pooling" nếu deploy serverless sau này). Dán vào `.env` làm `DATABASE_URL`.

- [ ] **Step 2: Cài Prisma**

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Lệnh này tạo sẵn `prisma/schema.prisma` — ghi đè bằng nội dung ở bước sau.

- [ ] **Step 3: Viết `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model JobTitle {
  id            String   @id @default(cuid())
  canonicalName String   @unique
  source        String
  content       Json
  viewCount     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

- [ ] **Step 4: Viết failing test cho `lib/db.ts`**

`lib/db.test.ts`:

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "./db";

describe("prisma JobTitle model", () => {
  afterEach(async () => {
    await prisma.jobTitle.deleteMany({ where: { canonicalName: "Test Job Title" } });
  });

  it("creates and reads back a JobTitle row", async () => {
    const created = await prisma.jobTitle.create({
      data: {
        canonicalName: "Test Job Title",
        source: "seed",
        content: { description: "test" },
      },
    });

    const found = await prisma.jobTitle.findUnique({
      where: { canonicalName: "Test Job Title" },
    });

    expect(found?.id).toBe(created.id);
    expect(found?.source).toBe("seed");
  });
});
```

- [ ] **Step 5: Chạy test, xác nhận fail**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 6: Chạy migration để tạo bảng thật trên Supabase**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 7: Viết `lib/db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 8: Chạy test, xác nhận pass**

Run: `npx vitest run lib/db.test.ts`
Expected: PASS (1 test) — test này gọi DB Supabase thật, cần `DATABASE_URL` đúng trong `.env`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema and DB client for JobTitle model"
```

---

### Task 3: JobContent types + chuẩn hóa input (normalize)

**Files:**
- Create: `types/job-content.ts`, `data/aliases.json`, `lib/normalize.ts`
- Test: `lib/normalize.test.ts`

**Interfaces:**
- Produces: `JobContent` type (spec §4's 8 khối), `SourcedValue<T>` type, `normalize(rawInput: string): NormalizeResult` — Task 4 (`canonical.ts`) consumes `normalize`.

- [ ] **Step 1: Viết `types/job-content.ts`**

```typescript
export interface SourcedValue<T> {
  value: T | null;
  source: string | null;
}

export interface SimilarJob {
  name: string;
  distinction: string;
}

export interface SkillItem {
  name: string;
  description: string;
}

export interface CareerStage {
  stageName: string;
  keySkills: string[];
  salaryRange: SourcedValue<string>;
  avgTimeToNextStage: string;
}

export interface JobContent {
  description: string;
  vnMarket: SourcedValue<string>;
  salary: SourcedValue<string>;
  demand: SourcedValue<string>;
  similarJobs: SimilarJob[];
  hardSkills: SkillItem[];
  softSkills: SkillItem[];
  futureSkills: SourcedValue<string[]>;
  careerPath: CareerStage[];
}

export type JobSource = "seed" | "generated";
```

- [ ] **Step 2: Kiểm tra `tsconfig.json` cho phép import JSON**

Mở `tsconfig.json`, đảm bảo `compilerOptions` có `"resolveJsonModule": true`. Nếu chưa có, thêm vào.

- [ ] **Step 3: Tạo `data/aliases.json`**

```json
{
  "synonyms": {
    "nhan vien kinh doanh": "Sales Executive",
    "sale": "Sales Executive",
    "sales": "Sales Executive",
    "ke toan": "Accountant",
    "phan tich du lieu": "Data Analyst"
  },
  "ambiguous": {
    "ba": ["Business Analyst", "Backend Developer"]
  }
}
```

- [ ] **Step 4: Viết failing test cho `normalize`**

`lib/normalize.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalize } from "./normalize";

describe("normalize", () => {
  it("resolves a known synonym to its canonical name", () => {
    const result = normalize("Nhân viên kinh doanh");
    expect(result.matchedSynonym).toBe("Sales Executive");
    expect(result.ambiguousCandidates).toBeNull();
  });

  it("flags an ambiguous abbreviation with a candidate list", () => {
    const result = normalize("BA");
    expect(result.ambiguousCandidates).toEqual(["Business Analyst", "Backend Developer"]);
    expect(result.matchedSynonym).toBeNull();
  });

  it("passes through an unrecognized input unchanged for further matching", () => {
    const result = normalize("Product Manager");
    expect(result.normalized).toBe("product manager");
    expect(result.matchedSynonym).toBeNull();
    expect(result.ambiguousCandidates).toBeNull();
  });
});
```

- [ ] **Step 5: Chạy test, xác nhận fail**

Run: `npx vitest run lib/normalize.test.ts`
Expected: FAIL — `Cannot find module './normalize'`

- [ ] **Step 6: Viết `lib/normalize.ts`**

```typescript
import aliasesData from "@/data/aliases.json";

export interface NormalizeResult {
  normalized: string;
  matchedSynonym: string | null;
  ambiguousCandidates: string[] | null;
}

function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalize(rawInput: string): NormalizeResult {
  const cleaned = stripDiacritics(rawInput.trim().toLowerCase());

  const ambiguousMatch = (aliasesData.ambiguous as Record<string, string[]>)[cleaned];
  if (ambiguousMatch) {
    return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: ambiguousMatch };
  }

  const synonymMatch = (aliasesData.synonyms as Record<string, string>)[cleaned];
  if (synonymMatch) {
    return { normalized: cleaned, matchedSynonym: synonymMatch, ambiguousCandidates: null };
  }

  return { normalized: cleaned, matchedSynonym: null, ambiguousCandidates: null };
}
```

- [ ] **Step 7: Chạy test, xác nhận pass**

Run: `npx vitest run lib/normalize.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add JobContent types and input normalization"
```

---

### Task 4: Canonical job title matching (kể cả xử lý lỗi chính tả)

**Files:**
- Create: `lib/canonical.ts`
- Test: `lib/canonical.test.ts`

**Interfaces:**
- Consumes: `normalize` (Task 3).
- Produces: `matchCanonical(rawInput: string, knownCanonicalNames: string[]): CanonicalMatchResult`, where `CanonicalMatchResult` is `{status:"matched",canonicalName} | {status:"ambiguous",candidates} | {status:"new",canonicalName}`. Task 9 (`lookup.ts`) consumes this.

- [ ] **Step 1: Cài thư viện fuzzy-match**

```bash
npm install fastest-levenshtein
```

- [ ] **Step 2: Viết failing test**

`lib/canonical.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { matchCanonical } from "./canonical";

const KNOWN_NAMES = ["Data Analyst", "Business Analyst", "Sales Executive"];

describe("matchCanonical", () => {
  it("matches exact canonical name case-insensitively", () => {
    const result = matchCanonical("data analyst", KNOWN_NAMES);
    expect(result).toEqual({ status: "matched", canonicalName: "Data Analyst" });
  });

  it("matches a typo within edit-distance tolerance", () => {
    const result = matchCanonical("Data Analyts", KNOWN_NAMES);
    expect(result).toEqual({ status: "matched", canonicalName: "Data Analyst" });
  });

  it("returns ambiguous for a known ambiguous abbreviation", () => {
    const result = matchCanonical("BA", KNOWN_NAMES);
    expect(result.status).toBe("ambiguous");
  });

  it("treats unrecognized-but-plausible input as a new canonical name", () => {
    const result = matchCanonical("product manager", KNOWN_NAMES);
    expect(result).toEqual({ status: "new", canonicalName: "Product Manager" });
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận fail**

Run: `npx vitest run lib/canonical.test.ts`
Expected: FAIL — `Cannot find module './canonical'`

- [ ] **Step 4: Viết `lib/canonical.ts`**

```typescript
import { distance } from "fastest-levenshtein";
import { normalize } from "./normalize";

export type CanonicalMatchResult =
  | { status: "matched"; canonicalName: string }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "new"; canonicalName: string };

const FUZZY_MATCH_MAX_DISTANCE = 2;

function toTitleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function matchCanonical(
  rawInput: string,
  knownCanonicalNames: string[]
): CanonicalMatchResult {
  const { normalized, matchedSynonym, ambiguousCandidates } = normalize(rawInput);

  if (ambiguousCandidates) {
    return { status: "ambiguous", candidates: ambiguousCandidates };
  }

  if (matchedSynonym) {
    return { status: "matched", canonicalName: matchedSynonym };
  }

  const exactMatch = knownCanonicalNames.find((name) => name.toLowerCase() === normalized);
  if (exactMatch) {
    return { status: "matched", canonicalName: exactMatch };
  }

  let closest: { name: string; dist: number } | null = null;
  for (const name of knownCanonicalNames) {
    const dist = distance(normalized, name.toLowerCase());
    if (dist <= FUZZY_MATCH_MAX_DISTANCE && (!closest || dist < closest.dist)) {
      closest = { name, dist };
    }
  }
  if (closest) {
    return { status: "matched", canonicalName: closest.name };
  }

  return { status: "new", canonicalName: toTitleCase(normalized) };
}
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `npx vitest run lib/canonical.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add canonical job title matching with typo tolerance"
```

---

### Task 5: Job repository (đọc/ghi DB cho seed set, cache, view count)

**Files:**
- Create: `lib/job-repository.ts`
- Test: `lib/job-repository.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `JobContent` type (Task 3).
- Produces: `findJobByCanonicalName`, `saveGeneratedJob`, `upsertSeedJob`, `incrementViewCount`, `listAllCanonicalNames`, `listUpgradeCandidates` — consumed by Task 9 (`lookup.ts`) và Task 10 (CLI script).

- [ ] **Step 1: Viết failing test**

`lib/job-repository.test.ts`:

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "./db";
import {
  findJobByCanonicalName,
  saveGeneratedJob,
  upsertSeedJob,
  incrementViewCount,
  listAllCanonicalNames,
  listUpgradeCandidates,
} from "./job-repository";
import type { JobContent } from "@/types/job-content";

const SAMPLE_CONTENT: JobContent = {
  description: "Test description",
  vnMarket: { value: null, source: null },
  salary: { value: null, source: null },
  demand: { value: null, source: null },
  similarJobs: [],
  hardSkills: [],
  softSkills: [],
  futureSkills: { value: null, source: null },
  careerPath: [],
};

describe("job-repository", () => {
  afterEach(async () => {
    await prisma.jobTitle.deleteMany({
      where: { canonicalName: { in: ["Repo Test Job", "Repo Seed Job"] } },
    });
  });

  it("returns null when a job title does not exist", async () => {
    const result = await findJobByCanonicalName("Repo Test Job");
    expect(result).toBeNull();
  });

  it("saves and retrieves a generated job", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const result = await findJobByCanonicalName("Repo Test Job");
    expect(result?.source).toBe("generated");
    expect(result?.content.description).toBe("Test description");
  });

  it("upserts a seed job with source seed", async () => {
    await upsertSeedJob("Repo Seed Job", SAMPLE_CONTENT);
    const result = await findJobByCanonicalName("Repo Seed Job");
    expect(result?.source).toBe("seed");
  });

  it("increments the view count", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const newCount = await incrementViewCount("Repo Test Job");
    expect(newCount).toBe(2); // saveGeneratedJob starts at 1
  });

  it("lists all canonical names including newly saved ones", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const names = await listAllCanonicalNames();
    expect(names).toContain("Repo Test Job");
  });

  it("lists only generated jobs at or above the view threshold as upgrade candidates", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    await incrementViewCount("Repo Test Job");
    await incrementViewCount("Repo Test Job"); // viewCount now 3
    await upsertSeedJob("Repo Seed Job", SAMPLE_CONTENT); // source seed, excluded regardless of views

    const candidates = await listUpgradeCandidates(3);
    const names = candidates.map((c) => c.canonicalName);
    expect(names).toContain("Repo Test Job");
    expect(names).not.toContain("Repo Seed Job");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/job-repository.test.ts`
Expected: FAIL — `Cannot find module './job-repository'`

- [ ] **Step 3: Viết `lib/job-repository.ts`**

```typescript
import { prisma } from "./db";
import type { JobContent, JobSource } from "@/types/job-content";

export interface JobRecord {
  canonicalName: string;
  source: JobSource;
  content: JobContent;
  viewCount: number;
}

function toJobRecord(row: {
  canonicalName: string;
  source: string;
  content: unknown;
  viewCount: number;
}): JobRecord {
  return {
    canonicalName: row.canonicalName,
    source: row.source as JobSource,
    content: row.content as JobContent,
    viewCount: row.viewCount,
  };
}

export async function findJobByCanonicalName(canonicalName: string): Promise<JobRecord | null> {
  const row = await prisma.jobTitle.findUnique({ where: { canonicalName } });
  return row ? toJobRecord(row) : null;
}

export async function saveGeneratedJob(canonicalName: string, content: JobContent): Promise<void> {
  await prisma.jobTitle.upsert({
    where: { canonicalName },
    create: { canonicalName, source: "generated", content: content as object, viewCount: 1 },
    update: { content: content as object },
  });
}

export async function upsertSeedJob(canonicalName: string, content: JobContent): Promise<void> {
  await prisma.jobTitle.upsert({
    where: { canonicalName },
    create: { canonicalName, source: "seed", content: content as object, viewCount: 0 },
    update: { source: "seed", content: content as object },
  });
}

export async function incrementViewCount(canonicalName: string): Promise<number> {
  const updated = await prisma.jobTitle.update({
    where: { canonicalName },
    data: { viewCount: { increment: 1 } },
  });
  return updated.viewCount;
}

export async function listAllCanonicalNames(): Promise<string[]> {
  const rows = await prisma.jobTitle.findMany({ select: { canonicalName: true } });
  return rows.map((r) => r.canonicalName);
}

export async function listUpgradeCandidates(minViews: number): Promise<JobRecord[]> {
  const rows = await prisma.jobTitle.findMany({
    where: { source: "generated", viewCount: { gte: minViews } },
  });
  return rows.map(toJobRecord);
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/job-repository.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add job repository for seed set, cache, and view tracking"
```

---

### Task 6: Tavily search client

**Files:**
- Create: `lib/tavily.ts`
- Test: `lib/tavily.test.ts`

**Interfaces:**
- Consumes: `getRequiredEnv` (Task 1).
- Produces: `searchTavily(query: string): Promise<SearchResultItem[]>` where `SearchResultItem = {title: string; url: string; content: string}` — consumed by Task 8 (`generate.ts`).

- [ ] **Step 1: Viết failing test**

`lib/tavily.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchTavily } from "./tavily";

describe("searchTavily", () => {
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "test-key";
  });

  it("sends the query to Tavily and returns parsed results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Báo cáo lương 2026",
            url: "https://example.com/report",
            content: "Nội dung tóm tắt...",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const results = await searchTavily("lương Data Analyst Việt Nam 2026");

    expect(results).toEqual([
      { title: "Báo cáo lương 2026", url: "https://example.com/report", content: "Nội dung tóm tắt..." },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws a descriptive error when Tavily responds with a failure status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" })
    );

    await expect(searchTavily("test query")).rejects.toThrow("Tavily search failed: 500");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/tavily.test.ts`
Expected: FAIL — `Cannot find module './tavily'`

- [ ] **Step 3: Viết `lib/tavily.ts`**

```typescript
import { getRequiredEnv } from "./env";

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
}

export async function searchTavily(query: string): Promise<SearchResultItem[]> {
  const apiKey = getRequiredEnv("TAVILY_API_KEY");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      search_depth: "advanced",
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{ title: string; url: string; content: string }>;
  };
  return data.results.map((r) => ({ title: r.title, url: r.url, content: r.content }));
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/tavily.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tavily search client"
```

---

### Task 7: DeepSeek client

**Files:**
- Create: `lib/deepseek.ts`
- Test: `lib/deepseek.test.ts`

**Interfaces:**
- Consumes: `getRequiredEnv` (Task 1).
- Produces: `completeWithDeepSeek(systemPrompt: string, userPrompt: string): Promise<string>` — consumed by Task 8 (`generate.ts`).

- [ ] **Step 1: Viết failing test**

`lib/deepseek.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeWithDeepSeek } from "./deepseek";

describe("completeWithDeepSeek", () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = "test-key";
  });

  it("sends system and user prompts and returns the completion text", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "kết quả tổng hợp" } }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await completeWithDeepSeek("system prompt", "user prompt");

    expect(result).toBe("kết quả tổng hợp");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });

  it("throws a descriptive error when DeepSeek responds with a failure status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" })
    );

    await expect(completeWithDeepSeek("s", "u")).rejects.toThrow(
      "DeepSeek completion failed: 429"
    );
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/deepseek.test.ts`
Expected: FAIL — `Cannot find module './deepseek'`

- [ ] **Step 3: Viết `lib/deepseek.ts`**

```typescript
import { getRequiredEnv } from "./env";

export async function completeWithDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = getRequiredEnv("DEEPSEEK_API_KEY");
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek completion failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/deepseek.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add DeepSeek completion client"
```

---

### Task 8: Generation pipeline (search + synthesis + validate citation)

**Files:**
- Create: `lib/generate.ts`
- Test: `lib/generate.test.ts`

**Interfaces:**
- Consumes: `searchTavily` (Task 6), `completeWithDeepSeek` (Task 7), `JobContent` type (Task 3).
- Produces: `generateJobContent(jobTitle: string): Promise<JobContent>`, `class GenerationError extends Error` — consumed by Task 9 (`lookup.ts`).

- [ ] **Step 1: Viết failing test**

`lib/generate.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateJobContent, GenerationError } from "./generate";
import * as tavilyModule from "./tavily";
import * as deepseekModule from "./deepseek";

describe("generateJobContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds JobContent with resolved source URLs when DeepSeek cites a valid source", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      {
        title: "Báo cáo lương IT 2026",
        url: "https://example.com/report",
        content: "Data Analyst lương 15-25 triệu",
      },
    ]);
    vi.spyOn(deepseekModule, "completeWithDeepSeek").mockResolvedValue(
      JSON.stringify({
        description: "Phân tích dữ liệu để hỗ trợ ra quyết định",
        vnMarket: { value: "Nhu cầu tăng mạnh", source: "Nguồn 1" },
        salary: { value: "15-25 triệu", source: "Nguồn 1" },
        demand: { value: "Cạnh tranh trung bình", source: null },
        similarJobs: [
          { name: "Business Analyst", distinction: "Tập trung vào nghiệp vụ hơn kỹ thuật" },
        ],
        hardSkills: [{ name: "SQL", description: "Truy vấn và xử lý dữ liệu" }],
        softSkills: [{ name: "Giao tiếp", description: "Trình bày insight cho stakeholder" }],
        futureSkills: { value: ["Python", "AI/ML cơ bản"], source: null },
        careerPath: [
          {
            stageName: "Fresher",
            keySkills: ["Excel", "SQL cơ bản"],
            salaryRange: { value: "10-15 triệu", source: "Nguồn 1" },
            avgTimeToNextStage: "1-2 năm",
          },
        ],
      })
    );

    const result = await generateJobContent("Data Analyst");

    expect(result.salary).toEqual({ value: "15-25 triệu", source: "https://example.com/report" });
    expect(result.demand).toEqual({ value: null, source: null });
    expect(result.careerPath[0].salaryRange.source).toBe("https://example.com/report");
  });

  it("throws GenerationError when no search results are found", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([]);

    await expect(generateJobContent("Nghề không tồn tại xyz")).rejects.toThrow(GenerationError);
  });

  it("throws GenerationError when DeepSeek returns invalid JSON", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      { title: "X", url: "https://example.com", content: "..." },
    ]);
    vi.spyOn(deepseekModule, "completeWithDeepSeek").mockResolvedValue("không phải JSON");

    await expect(generateJobContent("Data Analyst")).rejects.toThrow(GenerationError);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/generate.test.ts`
Expected: FAIL — `Cannot find module './generate'`

- [ ] **Step 3: Viết `lib/generate.ts`**

```typescript
import { searchTavily, type SearchResultItem } from "./tavily";
import { completeWithDeepSeek } from "./deepseek";
import type { JobContent } from "@/types/job-content";

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
    `${jobTitle} lương kỹ năng thị trường việc làm Việt Nam`
  );

  if (searchResults.length === 0) {
    throw new GenerationError(`Không tìm thấy nguồn nào cho "${jobTitle}"`);
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

function sourcedField<T>(
  field: { value: T | null; source: string | null } | undefined,
  searchResults: SearchResultItem[]
): { value: T | null; source: string | null } {
  const resolvedSource = resolveSource(field?.source, searchResults);
  if (!resolvedSource) {
    return { value: null, source: null };
  }
  return { value: field?.value ?? null, source: resolvedSource };
}

function validateAndNormalizeContent(
  parsed: unknown,
  searchResults: SearchResultItem[]
): JobContent {
  const obj = parsed as Record<string, any>;

  return {
    description: obj.description ?? "",
    vnMarket: sourcedField(obj.vnMarket, searchResults),
    salary: sourcedField(obj.salary, searchResults),
    demand: sourcedField(obj.demand, searchResults),
    similarJobs: obj.similarJobs ?? [],
    hardSkills: obj.hardSkills ?? [],
    softSkills: obj.softSkills ?? [],
    futureSkills: sourcedField(obj.futureSkills, searchResults),
    careerPath: (obj.careerPath ?? []).map((stage: any) => ({
      stageName: stage.stageName,
      keySkills: stage.keySkills ?? [],
      salaryRange: sourcedField(stage.salaryRange, searchResults),
      avgTimeToNextStage: stage.avgTimeToNextStage ?? "",
    })),
  };
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/generate.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add generation pipeline with citation validation"
```

---

### Task 9: Luồng tra cứu chính (lookup orchestration)

**Files:**
- Create: `lib/lookup.ts`
- Test: `lib/lookup.test.ts`

**Interfaces:**
- Consumes: `matchCanonical` (Task 4), `findJobByCanonicalName`/`saveGeneratedJob`/`incrementViewCount`/`listAllCanonicalNames` (Task 5), `generateJobContent`/`GenerationError` (Task 8).
- Produces: `lookupJob(rawInput: string): Promise<LookupResult>` — đây là entry point mà Plan 2 (UI) sẽ gọi trực tiếp từ 1 server action/API route.

- [ ] **Step 1: Viết failing test**

`lib/lookup.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupJob } from "./lookup";
import * as canonicalModule from "./canonical";
import * as repoModule from "./job-repository";
import * as generateModule from "./generate";

describe("lookupJob", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ambiguous candidates without touching generation", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "ambiguous",
      candidates: ["Business Analyst", "Backend Developer"],
    });
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("BA");

    expect(result).toEqual({
      status: "ambiguous",
      candidates: ["Business Analyst", "Backend Developer"],
    });
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("returns cached content and increments view count when job already exists", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue(["Data Analyst"]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "matched",
      canonicalName: "Data Analyst",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue({
      canonicalName: "Data Analyst",
      source: "seed",
      content: { description: "..." } as any,
      viewCount: 5,
    });
    const incrementSpy = vi.spyOn(repoModule, "incrementViewCount").mockResolvedValue(6);
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("data analyst");

    expect(result.status).toBe("found");
    expect(incrementSpy).toHaveBeenCalledWith("Data Analyst");
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("generates and saves new content when job title is new", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "new",
      canonicalName: "Product Manager",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue(null);
    const newContent = { description: "Quản lý sản phẩm" } as any;
    vi.spyOn(generateModule, "generateJobContent").mockResolvedValue(newContent);
    const saveSpy = vi.spyOn(repoModule, "saveGeneratedJob").mockResolvedValue();

    const result = await lookupJob("product manager");

    expect(result).toEqual({
      status: "found",
      canonicalName: "Product Manager",
      source: "generated",
      content: newContent,
    });
    expect(saveSpy).toHaveBeenCalledWith("Product Manager", newContent);
  });

  it("returns generation_failed with the error message when generation throws", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "new",
      canonicalName: "Nghề Không Tồn Tại Xyz",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue(null);
    vi.spyOn(generateModule, "generateJobContent").mockRejectedValue(
      new generateModule.GenerationError('Không tìm thấy nguồn nào cho "Nghề Không Tồn Tại Xyz"')
    );

    const result = await lookupJob("nghề không tồn tại xyz");

    expect(result).toEqual({
      status: "generation_failed",
      message: 'Không tìm thấy nguồn nào cho "Nghề Không Tồn Tại Xyz"',
    });
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/lookup.test.ts`
Expected: FAIL — `Cannot find module './lookup'`

- [ ] **Step 3: Viết `lib/lookup.ts`**

```typescript
import { matchCanonical } from "./canonical";
import {
  findJobByCanonicalName,
  saveGeneratedJob,
  incrementViewCount,
  listAllCanonicalNames,
} from "./job-repository";
import { generateJobContent, GenerationError } from "./generate";
import type { JobContent, JobSource } from "@/types/job-content";

export type LookupResult =
  | { status: "found"; canonicalName: string; source: JobSource; content: JobContent }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "generation_failed"; message: string };

export async function lookupJob(rawInput: string): Promise<LookupResult> {
  const knownNames = await listAllCanonicalNames();
  const match = matchCanonical(rawInput, knownNames);

  if (match.status === "ambiguous") {
    return { status: "ambiguous", candidates: match.candidates };
  }

  const existing = await findJobByCanonicalName(match.canonicalName);
  if (existing) {
    await incrementViewCount(match.canonicalName);
    return {
      status: "found",
      canonicalName: existing.canonicalName,
      source: existing.source,
      content: existing.content,
    };
  }

  try {
    const content = await generateJobContent(match.canonicalName);
    await saveGeneratedJob(match.canonicalName, content);
    return { status: "found", canonicalName: match.canonicalName, source: "generated", content };
  } catch (error) {
    const message =
      error instanceof GenerationError
        ? error.message
        : "Có lỗi xảy ra khi tạo nội dung, vui lòng thử lại sau";
    return { status: "generation_failed", message };
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/lookup.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add main lookup orchestration"
```

---

### Task 10: CLI script để thêm/cập nhật seed set thủ công

**Files:**
- Create: `scripts/add-seed.ts`
- Test: none (glue code — logic thật đã test ở Task 5 qua `upsertSeedJob`; verify bằng chạy tay ở Step 3)

**Interfaces:**
- Consumes: `upsertSeedJob` (Task 5).

- [ ] **Step 1: Cài `tsx` để chạy script TypeScript trực tiếp**

```bash
npm install -D tsx
```

- [ ] **Step 2: Viết `scripts/add-seed.ts`**

```typescript
import fs from "node:fs";
import { upsertSeedJob } from "../lib/job-repository";
import { prisma } from "../lib/db";
import type { JobContent } from "../types/job-content";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Cách dùng: npx tsx scripts/add-seed.ts <đường-dẫn-file.json>");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as { canonicalName: string; content: JobContent };

  await upsertSeedJob(data.canonicalName, data.content);
  console.log(`Đã lưu seed cho "${data.canonicalName}"`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Verify thủ công**

Tạo file mẫu `scratch/sample-seed.json`:

```json
{
  "canonicalName": "Data Analyst",
  "content": {
    "description": "Thu thập, xử lý và phân tích dữ liệu để hỗ trợ ra quyết định kinh doanh.",
    "vnMarket": { "value": "Nhu cầu tăng mạnh trong 3 năm qua", "source": "https://example.com/report" },
    "salary": { "value": "12-30 triệu tùy cấp bậc", "source": "https://example.com/report" },
    "demand": { "value": null, "source": null },
    "similarJobs": [{ "name": "Business Analyst", "distinction": "Thiên về nghiệp vụ hơn kỹ thuật" }],
    "hardSkills": [{ "name": "SQL", "description": "Truy vấn và xử lý dữ liệu quan hệ" }],
    "softSkills": [{ "name": "Giao tiếp", "description": "Trình bày insight cho người không chuyên" }],
    "futureSkills": { "value": ["Python", "AI/ML cơ bản"], "source": null },
    "careerPath": [
      {
        "stageName": "Fresher",
        "keySkills": ["Excel", "SQL cơ bản"],
        "salaryRange": { "value": "10-15 triệu", "source": "https://example.com/report" },
        "avgTimeToNextStage": "1-2 năm"
      }
    ]
  }
}
```

Chạy:

```bash
npx tsx scripts/add-seed.ts scratch/sample-seed.json
```

Expected: in ra `Đã lưu seed cho "Data Analyst"`, và query `SELECT * FROM "JobTitle" WHERE "canonicalName" = 'Data Analyst'` trên Supabase thấy `source = 'seed'`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add CLI script to upsert seed set entries"
```

---

## Self-Review Notes

- **Spec coverage:** Task 3 → spec §4 (schema); Task 5 + Task 10 → spec §5 Luồng A; Task 6-8 → spec §5 Luồng B; Task 4 + Task 9 → spec §6 (chuẩn hóa, ambiguous, cache-then-generate, error handling khi không tìm được nguồn). UI/hiển thị badge (spec §6 phần "Render") và cơ chế nâng cấp thủ công từ `listUpgradeCandidates` sang seed set thuộc Plan 2 hoặc quy trình vận hành thủ công, không thuộc phạm vi data layer này.
- **Type consistency:** `JobContent`, `SourcedValue<T>`, `CareerStage`, `SimilarJob`, `SkillItem` định nghĩa 1 lần ở Task 3, dùng nhất quán xuyên suốt Task 5, 8, 9.
- **No placeholders:** mọi step có code thật; Task 10 không có automated test vì là CLI glue thuần túy quanh hàm đã test — verify bằng chạy tay, đúng tinh thần "Task Right-Sizing".
