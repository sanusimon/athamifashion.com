import { promises as fs } from "fs";
import path from "path";
import { Review, ReviewRequest } from "@/types/review";

export type ReviewData = {
  reviews: Review[];
  requests: ReviewRequest[];
};

const dataFolder = path.join(process.cwd(), "reviews-data");
const dataFile = path.join(dataFolder, "reviews.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(dataFolder, { recursive: true });
    await fs.access(dataFile);
  } catch (error) {
    const initial: ReviewData = { reviews: [], requests: [] };
    await fs.writeFile(dataFile, JSON.stringify(initial, null, 2), "utf8");
  }
}

export async function readReviewData(): Promise<ReviewData> {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as ReviewData;
}

export async function writeReviewData(data: ReviewData): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}
