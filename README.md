# Career Job Lookup

Tra cứu nghề nghiệp cho người trẻ Việt Nam (học sinh, sinh viên, mới ra trường): nhập 1 job
title → nhận mô tả nghề, thị trường VN, mức lương, kỹ năng, và lộ trình sự nghiệp — mọi số
liệu đều có nguồn trích dẫn, không bịa.

Xem đầy đủ bối cảnh/thiết kế tại:
- [Design spec](docs/superpowers/specs/2026-09-16-career-job-lookup-design.md)
- [Plan 1 — Data layer & generation pipeline](docs/superpowers/plans/2026-09-16-data-layer-generation-pipeline.md)
- [Plan 2 — UI](docs/superpowers/plans/2026-09-16-ui-job-lookup.md)

## Kiến trúc

Next.js (App Router, TypeScript) làm app shell; toàn bộ logic nằm trong các module
framework-agnostic ở `lib/`, dùng Prisma + PostgreSQL (Supabase) để lưu dữ liệu.

- **Luồng A — Seed set:** ~8 job title phổ biến (xem `data/seeds/`) đã được đối chiếu thủ
  công với nguồn uy tín, lưu tĩnh, badge "Đã đối chiếu nguồn".
- **Luồng B — Long-tail:** job title ngoài seed set được AI generate on-demand (Tavily
  search + DeepSeek synthesis), giới hạn cứng vào danh sách domain uy tín trong
  `data/trusted-sources.json` (McKinsey, KPMG, BCG, Deloitte, PwC, Adecco, Michael Page,
  Mercer, ManpowerGroup, Robert Walters, Hays, VietnamWorks, TopCV, ITviec, Indeed, GSO) và
  chỉ nhận nội dung xuất bản trong 3 năm gần đây. Không có nguồn thoả điều kiện → báo lỗi
  thân thiện, không mở rộng tìm kiếm, không bịa số liệu. Kết quả được cache, badge "AI tổng
  hợp, đang chờ xác thực".

## Bắt đầu

### 1. Cài dependency

```bash
npm ci
```

### 2. Tạo `.env`

Copy `.env.example` thành `.env` và điền:

```
DATABASE_URL=       # connection string Supabase/Postgres
TAVILY_API_KEY=      # từ tavily.com → Overview → API Keys (free tier ~1000 request/tháng)
DEEPSEEK_API_KEY=    # từ platform.deepseek.com → API Keys (key có dạng "sk-...", KHÔNG phải "sk-proj-..." — đó là định dạng của OpenAI)
```

### 3. Generate Prisma client + migrate

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Test

```bash
npm test
```

Test component (`.test.tsx`) tự bật môi trường `jsdom` qua docblock `// @vitest-environment
jsdom` ở đầu file; test logic (`lib/*.test.ts`) chạy môi trường `node` mặc định — không cần
đổi config khi thêm test mới, cứ theo đúng pattern file đã có.

## Vận hành seed set (thao tác thủ công định kỳ)

**Thêm/cập nhật 1 seed job title:**

```bash
npx tsx scripts/add-seed.ts path/to/job.json
```

File JSON theo schema `{ canonicalName: string, content: JobContent }` — xem
`types/job-content.ts` và các file mẫu trong `data/seeds/` để biết cấu trúc chính xác. Mọi
số liệu (`SourcedValue`) phải có `source` là URL thật nằm trong `data/trusted-sources.json`,
xuất bản trong 3 năm gần đây — không có nguồn đạt chuẩn thì để `value: null, source: null`.

**Xem danh sách long-tail job title đủ lượt tra để cân nhắc nâng lên seed set:**

```bash
npx tsx scripts/list-upgrade-candidates.ts [số-lượt-tra-tối-thiểu]   # mặc định: 5
```

## Cấu trúc thư mục

```
app/            Next.js App Router — page.tsx, layout.tsx, actions.ts (Server Action)
components/     React component (JobSearchForm, JobResultView, SourceBadge, ...)
lib/            Logic thuần TypeScript — normalize, canonical match, generate, lookup...
types/          JobContent, SourcedValue<T>, LookupResult...
data/           aliases.json (đồng nghĩa/viết tắt), trusted-sources.json (domain allowlist),
                seeds/ (seed data đã đối chiếu nguồn)
scripts/        CLI vận hành (add-seed, list-upgrade-candidates)
prisma/         Schema + migration
docs/superpowers/  Spec + implementation plan
```
