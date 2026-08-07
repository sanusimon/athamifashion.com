import { handleOrderReviewWebhook } from "@/lib/reviewOrderWebhook";

export async function POST(request: Request) {
  return handleOrderReviewWebhook(request);
}

export async function GET() {
  return new Response(JSON.stringify({ message: "Order review webhook endpoint" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
