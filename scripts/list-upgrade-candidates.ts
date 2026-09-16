import { listUpgradeCandidates } from "../lib/job-repository";
import { prisma } from "../lib/db";

const DEFAULT_MIN_VIEWS = 5;

async function main() {
  const arg = process.argv[2];
  const minViews = arg ? parseInt(arg, 10) : DEFAULT_MIN_VIEWS;

  if (Number.isNaN(minViews) || minViews < 1) {
    console.error("Cách dùng: npx tsx scripts/list-upgrade-candidates.ts [số-lượt-tra-tối-thiểu]");
    process.exit(1);
  }

  const candidates = await listUpgradeCandidates(minViews);

  if (candidates.length === 0) {
    console.log(`Không có job title nào (nguồn "generated") đạt ${minViews}+ lượt tra.`);
    return;
  }

  candidates.sort((a, b) => b.viewCount - a.viewCount);

  console.log(
    `${candidates.length} ứng viên nâng cấp lên seed set (≥${minViews} lượt tra, nguồn "generated"):\n`
  );
  for (const candidate of candidates) {
    console.log(`  ${candidate.viewCount.toString().padStart(4)} lượt  —  ${candidate.canonicalName}`);
  }
  console.log(
    `\nĐể nâng cấp: đối chiếu thủ công nội dung theo data/trusted-sources.json rồi chạy` +
      ` npx tsx scripts/add-seed.ts <file.json>`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
