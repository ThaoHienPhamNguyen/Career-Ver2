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
