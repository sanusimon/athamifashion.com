import { NextResponse } from "next/server";
import { getReviewSummaryByProductId } from "@/lib/reviewService";

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  const summary = await getReviewSummaryByProductId(params.productId);
  return NextResponse.json({ summary });
}
