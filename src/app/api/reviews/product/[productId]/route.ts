import { NextResponse } from "next/server";
import { getReviewSummaryByProductId } from "@/lib/reviewService";

export async function GET(request: Request, context: any) {
  const summary = await getReviewSummaryByProductId(context.params.productId);
  return NextResponse.json({ summary });
}
