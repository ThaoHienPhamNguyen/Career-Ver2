# Career Job Lookup — UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the user-facing UI for the career job lookup tool — a search box that calls the existing `lookupJob` orchestration and renders the 8-block job content with source badges, an ambiguous-title picker, and a friendly error state. Plan 2 of 2 (Plan 1 built the data layer + generation pipeline this UI calls).

**Architecture:** Next.js App Router. A single Server Action (`lookupJobAction`) is the thin API layer wrapping `lib/lookup.ts`'s already-tested `lookupJob`. Presentational logic is split into small, framework-agnostic pure functions (`lib/format-sourced.ts`) and small React components (`components/`), composed by one client component (`JobSearchForm`) that owns the search/result state machine. `app/page.tsx` just renders `JobSearchForm`.

**Tech Stack:** Next.js (App Router, TypeScript), React 19, Tailwind CSS v4, Vitest, @testing-library/react + @testing-library/user-event + jsdom (component tests use a per-file `// @vitest-environment jsdom` override; pure-logic tests keep the project's default `node` environment).

**Spec:** `docs/superpowers/specs/2026-09-16-career-job-lookup-design.md`

**Depends on (already implemented, Plan 1):** `lib/lookup.ts` (`lookupJob`, `LookupResult`), `types/job-content.ts` (`JobContent`, `SourcedValue<T>`, `JobSource`, `CareerStage`, `SimilarJob`, `SkillItem`).

## Global Constraints

- Badge chữ đúng nguyên văn: nguồn `"seed"` → "Đã đối chiếu nguồn"; nguồn `"generated"` → "AI tổng hợp, đang chờ xác thực" (spec §5).
- Giá trị `SourcedValue` có `value: null` → hiển thị đúng nguyên văn "Chưa có dữ liệu xác thực", không để trống, không bịa số liệu (spec §4, §6).
- Job title mơ hồ (`status: "ambiguous"`) → hiển thị danh sách candidates để user tự chọn, không tự đoán và không gọi generate cho tới khi user chọn (spec §6).
- Generate thất bại (`status: "generation_failed"`) → hiển thị `message` từ kết quả dưới dạng thông báo lỗi thân thiện, không hiển thị block nội dung rỗng giả vờ là kết quả thật (spec §6).

---

### Task 1: Hàm format cho `SourcedValue` (pure logic, không cần jsdom)

**Files:**
- Create: `lib/format-sourced.ts`
- Test: `lib/format-sourced.test.ts`

**Interfaces:**
- Consumes: `SourcedValue<T>` type (`types/job-content.ts`, đã có từ Plan 1).
- Produces: `NO_VERIFIED_DATA_TEXT: string`, `formatSourcedText(field: SourcedValue<string>): string`, `formatSourcedList(field: SourcedValue<string[]>): string[] | null`. Task 3 (`SourcedField.tsx`) consumes cả ba.

- [ ] **Step 1: Viết failing test**

`lib/format-sourced.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatSourcedText, formatSourcedList, NO_VERIFIED_DATA_TEXT } from "./format-sourced";

describe("formatSourcedText", () => {
  it("returns the value when present", () => {
    expect(formatSourcedText({ value: "15-25 triệu", source: "https://example.com" })).toBe(
      "15-25 triệu"
    );
  });

  it("returns the fallback text when value is null", () => {
    expect(formatSourcedText({ value: null, source: null })).toBe(NO_VERIFIED_DATA_TEXT);
  });
});

describe("formatSourcedList", () => {
  it("returns the list when present", () => {
    expect(
      formatSourcedList({ value: ["Python", "SQL"], source: "https://example.com" })
    ).toEqual(["Python", "SQL"]);
  });

  it("returns null when value is null", () => {
    expect(formatSourcedList({ value: null, source: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run lib/format-sourced.test.ts`
Expected: FAIL — `Cannot find module './format-sourced'`

- [ ] **Step 3: Viết `lib/format-sourced.ts`**

```typescript
import type { SourcedValue } from "@/types/job-content";

export const NO_VERIFIED_DATA_TEXT = "Chưa có dữ liệu xác thực";

export function formatSourcedText(field: SourcedValue<string>): string {
  return field.value ?? NO_VERIFIED_DATA_TEXT;
}

export function formatSourcedList(field: SourcedValue<string[]>): string[] | null {
  return field.value;
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run lib/format-sourced.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/format-sourced.ts lib/format-sourced.test.ts
git commit -m "feat: add SourcedValue formatting helpers"
```

---

### Task 2: Hạ tầng test component (Vitest + React Testing Library) + `SourceBadge`

**Files:**
- Modify: `package.json` (bump `@types/node` lên `^22` — fix xung đột peer dependency có sẵn chặn `npm install` khi thêm bất kỳ package nào phụ thuộc vitest's peer range; thêm `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` vào devDependencies)
- Create: `vitest.setup.ts`
- Modify: `vitest.config.ts` (thêm `setupFiles`)
- Create: `components/SourceBadge.tsx`
- Test: `components/SourceBadge.test.tsx`

**Interfaces:**
- Consumes: `JobSource` type (`types/job-content.ts`).
- Produces: `getSourceBadgeLabel(source: JobSource): string`, `<SourceBadge source={JobSource} />` — Task 4 (`JobResultView.tsx`) consumes cả hai.

- [ ] **Step 1: Sửa `@types/node` trong `package.json`**

Trong `devDependencies`, đổi `"@types/node": "^20"` thành `"@types/node": "^22"`.

(Lý do: vitest 5 khai báo peer `@types/node@"^22.0.0 || >=24.0.0"`. Root project đang pin `^20`, nên bất kỳ lệnh `npm install` thêm package mới nào cũng sẽ fail với `ERESOLVE` cho tới khi version này được nâng lên.)

- [ ] **Step 2: Cài React Testing Library + jsdom**

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Tạo `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Sửa `vitest.config.ts` — thêm `setupFiles`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/.git/**", "**/.claude/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

(Giữ nguyên `environment: "node"` mặc định cho các test hiện có ở `lib/`. Các test component ở bước sau tự bật jsdom qua docblock `// @vitest-environment jsdom` ở đầu file — không cần đổi environment toàn cục.)

- [ ] **Step 5: Viết failing test cho `SourceBadge`**

`components/SourceBadge.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourceBadge, getSourceBadgeLabel } from "./SourceBadge";

describe("getSourceBadgeLabel", () => {
  it("returns the seed label for source seed", () => {
    expect(getSourceBadgeLabel("seed")).toBe("Đã đối chiếu nguồn");
  });

  it("returns the generated label for source generated", () => {
    expect(getSourceBadgeLabel("generated")).toBe("AI tổng hợp, đang chờ xác thực");
  });
});

describe("SourceBadge", () => {
  it("renders the seed badge text", () => {
    render(<SourceBadge source="seed" />);
    expect(screen.getByText("Đã đối chiếu nguồn")).toBeInTheDocument();
  });

  it("renders the generated badge text", () => {
    render(<SourceBadge source="generated" />);
    expect(screen.getByText("AI tổng hợp, đang chờ xác thực")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Chạy test, xác nhận fail**

Run: `npx vitest run components/SourceBadge.test.tsx`
Expected: FAIL — `Cannot find module './SourceBadge'`

- [ ] **Step 7: Viết `components/SourceBadge.tsx`**

```typescript
import type { JobSource } from "@/types/job-content";

export function getSourceBadgeLabel(source: JobSource): string {
  return source === "seed" ? "Đã đối chiếu nguồn" : "AI tổng hợp, đang chờ xác thực";
}

export function SourceBadge({ source }: { source: JobSource }) {
  const isSeed = source === "seed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        isSeed
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      }`}
    >
      {getSourceBadgeLabel(source)}
    </span>
  );
}
```

- [ ] **Step 8: Chạy test, xác nhận pass**

Run: `npx vitest run components/SourceBadge.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 9: Chạy toàn bộ suite để xác nhận không phá test cũ**

Run: `npx vitest run`
Expected: PASS (tất cả file, gồm các test `lib/` cũ chạy môi trường `node` lẫn `components/SourceBadge.test.tsx` chạy `jsdom`)

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts components/SourceBadge.tsx components/SourceBadge.test.tsx
git commit -m "feat: add React Testing Library infra and SourceBadge component"
```

---

### Task 3: `SourcedField` + `SourcedListField` component

**Files:**
- Create: `components/SourcedField.tsx`
- Test: `components/SourcedField.test.tsx`

**Interfaces:**
- Consumes: `formatSourcedText`, `formatSourcedList`, `NO_VERIFIED_DATA_TEXT` (Task 1); `SourcedValue<T>` type.
- Produces: `<SourcedField label={string} field={SourcedValue<string>} />`, `<SourcedListField label={string} field={SourcedValue<string[]>} />` — Task 4 (`JobResultView.tsx`) consumes cả hai.

- [ ] **Step 1: Viết failing test**

`components/SourcedField.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SourcedField, SourcedListField } from "./SourcedField";

describe("SourcedField", () => {
  it("renders the value and a source link when present", () => {
    render(
      <SourcedField label="Mức lương" field={{ value: "15-25 triệu", source: "https://example.com" }} />
    );
    expect(screen.getByText("15-25 triệu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nguồn" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
  });

  it("renders the fallback text and no link when value is null", () => {
    render(<SourcedField label="Nhu cầu" field={{ value: null, source: null }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("SourcedListField", () => {
  it("renders each list item", () => {
    render(
      <SourcedListField
        label="Skill tương lai"
        field={{ value: ["Python", "AI/ML cơ bản"], source: null }}
      />
    );
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("AI/ML cơ bản")).toBeInTheDocument();
  });

  it("renders the fallback text when value is null", () => {
    render(<SourcedListField label="Skill tương lai" field={{ value: null, source: null }} />);
    expect(screen.getByText("Chưa có dữ liệu xác thực")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run components/SourcedField.test.tsx`
Expected: FAIL — `Cannot find module './SourcedField'`

- [ ] **Step 3: Viết `components/SourcedField.tsx`**

```typescript
import { formatSourcedText, formatSourcedList, NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { SourcedValue } from "@/types/job-content";

function SourceLink({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
    >
      Nguồn
    </a>
  );
}

export function SourcedField({ label, field }: { label: string; field: SourcedValue<string> }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
        {formatSourcedText(field)}
        <SourceLink source={field.source} />
      </dd>
    </div>
  );
}

export function SourcedListField({
  label,
  field,
}: {
  label: string;
  field: SourcedValue<string[]>;
}) {
  const items = formatSourcedList(field);
  return (
    <div>
      <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
        {items ? (
          <ul className="list-disc pl-5">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          NO_VERIFIED_DATA_TEXT
        )}
        <SourceLink source={field.source} />
      </dd>
    </div>
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run components/SourcedField.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/SourcedField.tsx components/SourcedField.test.tsx
git commit -m "feat: add SourcedField and SourcedListField components"
```

---

### Task 4: `JobResultView` — hiển thị đủ 8 khối nội dung

**Files:**
- Create: `components/JobResultView.tsx`
- Test: `components/JobResultView.test.tsx`

**Interfaces:**
- Consumes: `SourceBadge` (Task 2), `SourcedField`/`SourcedListField` (Task 3), `JobContent`/`JobSource` types.
- Produces: `<JobResultView canonicalName={string} source={JobSource} content={JobContent} />` — Task 6 (`JobSearchForm.tsx`) consumes đây.

- [ ] **Step 1: Viết failing test**

`components/JobResultView.test.tsx`:

```typescript
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
      keySkills: ["Excel", "SQL cơ bản"],
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
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run components/JobResultView.test.tsx`
Expected: FAIL — `Cannot find module './JobResultView'`

- [ ] **Step 3: Viết `components/JobResultView.tsx`**

```typescript
import type { JobContent, JobSource } from "@/types/job-content";
import { SourceBadge } from "./SourceBadge";
import { SourcedField, SourcedListField } from "./SourcedField";

export function JobResultView({
  canonicalName,
  source,
  content,
}: {
  canonicalName: string;
  source: JobSource;
  content: JobContent;
}) {
  return (
    <article className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {canonicalName}
        </h2>
        <SourceBadge source={source} />
      </header>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Mô tả nghề</h3>
        <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">{content.description}</p>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <SourcedField label="Thị trường VN" field={content.vnMarket} />
        <SourcedField label="Mức lương" field={content.salary} />
        <SourcedField label="Nhu cầu tuyển dụng" field={content.demand} />
        <SourcedListField label="Skill tương lai" field={content.futureSkills} />
      </dl>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Ngành dễ nhầm lẫn
        </h3>
        <ul className="mt-2 flex flex-col gap-2">
          {content.similarJobs.map((job) => (
            <li key={job.name}>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{job.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400"> — {job.distinction}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Hard skill</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {content.hardSkills.map((skill) => (
              <li key={skill.name}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{skill.name}</span>
                <span className="text-zinc-600 dark:text-zinc-400"> — {skill.description}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Soft skill</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {content.softSkills.map((skill) => (
              <li key={skill.name}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{skill.name}</span>
                <span className="text-zinc-600 dark:text-zinc-400"> — {skill.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Career path</h3>
        <ol className="mt-2 flex flex-col gap-4">
          {content.careerPath.map((stage) => (
            <li
              key={stage.stageName}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{stage.stageName}</h4>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Skill trọng tâm: {stage.keySkills.join(", ")}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Thời gian trung bình lên giai đoạn kế: {stage.avgTimeToNextStage}
              </p>
              <div className="mt-2">
                <SourcedField label="Lương tham khảo" field={stage.salaryRange} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run components/JobResultView.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/JobResultView.tsx components/JobResultView.test.tsx
git commit -m "feat: add JobResultView component rendering the 8 content blocks"
```

---

### Task 5: Server Action `lookupJobAction`

**Files:**
- Create: `app/actions.ts`
- Test: none (glue code thuần túy quanh `lookupJob` đã test đầy đủ ở Plan 1; verify bằng test của Task 6 — mock module này — và chạy tay ở Task 7)

**Interfaces:**
- Consumes: `lookupJob`, `LookupResult` (`lib/lookup.ts`, đã có từ Plan 1).
- Produces: `lookupJobAction(rawInput: string): Promise<LookupResult>` — Task 6 (`JobSearchForm.tsx`) consumes đây (và mock nó trong test).

- [ ] **Step 1: Viết `app/actions.ts`**

```typescript
"use server";

import { lookupJob, type LookupResult } from "@/lib/lookup";

export async function lookupJobAction(rawInput: string): Promise<LookupResult> {
  return lookupJob(rawInput);
}
```

- [ ] **Step 2: Kiểm tra kiểu build (không cần chạy dev server)**

Run: `npx tsc --noEmit`
Expected: không có lỗi type mới liên quan tới `app/actions.ts`

- [ ] **Step 3: Commit**

```bash
git add app/actions.ts
git commit -m "feat: add lookupJobAction server action"
```

---

### Task 6: `JobSearchForm` — form tra cứu + state machine

**Files:**
- Create: `components/JobSearchForm.tsx`
- Test: `components/JobSearchForm.test.tsx`

**Interfaces:**
- Consumes: `lookupJobAction` (Task 5, mock trong test), `JobResultView` (Task 4), `LookupResult` type.
- Produces: `<JobSearchForm />` — Task 7 (`app/page.tsx`) consumes đây.

- [ ] **Step 1: Viết failing test**

`components/JobSearchForm.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `npx vitest run components/JobSearchForm.test.tsx`
Expected: FAIL — `Cannot find module './JobSearchForm'`

- [ ] **Step 3: Viết `components/JobSearchForm.tsx`**

```typescript
"use client";

import { useState, type FormEvent } from "react";
import { lookupJobAction } from "@/app/actions";
import type { LookupResult } from "@/lib/lookup";
import { JobResultView } from "./JobResultView";

type Status = "idle" | "loading";

export function JobSearchForm() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function runSearch(jobTitle: string) {
    setStatus("loading");
    const nextResult = await lookupJobAction(jobTitle);
    setResult(nextResult);
    setStatus("idle");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;
    void runSearch(input.trim());
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập tên nghề, ví dụ: Data Analyst"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "loading" ? "Đang tra cứu..." : "Tra cứu"}
        </button>
      </form>

      {result?.status === "ambiguous" && (
        <div className="flex flex-col gap-2">
          <p className="text-zinc-900 dark:text-zinc-100">Bạn muốn tra cứu nghề nào?</p>
          <div className="flex flex-wrap gap-2">
            {result.candidates.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => void runSearch(candidate)}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
      )}

      {result?.status === "generation_failed" && (
        <p className="text-red-600 dark:text-red-400">{result.message}</p>
      )}

      {result?.status === "found" && (
        <JobResultView
          canonicalName={result.canonicalName}
          source={result.source}
          content={result.content}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `npx vitest run components/JobSearchForm.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/JobSearchForm.tsx components/JobSearchForm.test.tsx
git commit -m "feat: add JobSearchForm component with ambiguous/error/result states"
```

---

### Task 7: Wire vào `app/page.tsx` + metadata

**Files:**
- Modify: `app/page.tsx` (thay scaffold mặc định bằng `JobSearchForm`)
- Modify: `app/layout.tsx` (metadata title/description tiếng Việt)
- Test: không có test tự động (composition thuần túy của các component đã test); verify bằng chạy tay ở Step 3

**Interfaces:**
- Consumes: `JobSearchForm` (Task 6).

- [ ] **Step 1: Viết `app/page.tsx`**

```typescript
import { JobSearchForm } from "@/components/JobSearchForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Tra cứu nghề nghiệp
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nhập tên một nghề để xem mô tả, thị trường, mức lương, kỹ năng và lộ trình sự nghiệp.
        </p>
      </div>
      <div className="mt-8 flex w-full flex-col items-center">
        <JobSearchForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Sửa metadata trong `app/layout.tsx`**

Trong `export const metadata: Metadata = {...}`, đổi:

```typescript
export const metadata: Metadata = {
  title: "Tra cứu nghề nghiệp",
  description: "Tìm hiểu một nghề: mô tả, thị trường VN, mức lương, kỹ năng và lộ trình sự nghiệp.",
};
```

- [ ] **Step 3: Verify thủ công**

```bash
npm run dev
```

Mở `http://localhost:3000`, nhập một job title đã có seed (ví dụ "Data Analyst" nếu đã chạy `scripts/add-seed.ts` ở Plan 1), xác nhận:
- Kết quả hiển thị đủ 8 khối, badge đúng ("Đã đối chiếu nguồn" hoặc "AI tổng hợp, đang chờ xác thực").
- Nhập "BA" → hiện danh sách candidates, click một candidate → tra lại đúng nghề đó.
- Nhập một chuỗi vô nghĩa → hiển thị thông báo lỗi thân thiện, không crash, không hiển thị block rỗng.

Dừng dev server (Ctrl+C) sau khi xác nhận.

- [ ] **Step 4: Chạy lại toàn bộ test suite**

Run: `npx vitest run`
Expected: PASS (tất cả file, cả `lib/` từ Plan 1 lẫn `components/`, `lib/format-sourced.test.ts` mới)

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: wire JobSearchForm into the home page"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1+3+4 → spec §4 (8 khối nội dung, nguyên tắc "chưa có dữ liệu xác thực" cho giá trị null); Task 2+4 → spec §5 (badge "Đã đối chiếu nguồn" / "AI tổng hợp, đang chờ xác thực"); Task 5+6 → spec §6 (luồng chuẩn hóa → ambiguous hỏi lại user → cache/generate → hiển thị, xử lý lỗi generate thân thiện). Nâng cấp tự động seed set (từ `listUpgradeCandidates`) vẫn ngoài phạm vi — là quy trình vận hành thủ công, đúng như Plan 1 đã ghi chú.
- **Type consistency:** `JobContent`, `SourcedValue<T>`, `JobSource`, `LookupResult` dùng nguyên vẹn từ Plan 1 (`types/job-content.ts`, `lib/lookup.ts`), không định nghĩa lại. `formatSourcedText`/`formatSourcedList` (Task 1) là tên duy nhất dùng xuyên suốt Task 3-4.
- **No placeholders:** mọi step có code thật, chạy được; Task 5 và Task 7 không có test tự động vì là glue/composition thuần túy quanh code đã test — verify bằng chạy tay, đúng tinh thần "Task Right-Sizing" (giống Task 10 của Plan 1).
- **Dependency fix:** Task 2 sửa `@types/node` lên `^22` vì xung đột peer dependency có sẵn trong repo (phát hiện khi cố `npm install` thêm package mới) — không phải yêu cầu mới, mà là fix cho một vấn đề tồn tại từ trước chặn mọi lần cài thêm dependency.
