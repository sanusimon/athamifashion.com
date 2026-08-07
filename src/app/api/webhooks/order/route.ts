import { handleOrderReviewWebhook } from "@/lib/reviewOrderWebhook";

export async function POST(request: Request) {
  return handleOrderReviewWebhook(request);
}
