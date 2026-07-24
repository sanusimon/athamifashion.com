import { NextRequest, NextResponse } from "next/server";
import { approveReview } from "@/lib/reviewService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  const review = await approveReview(reviewId);

  if (!review) {
    return NextResponse.json(
      { error: "Review not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    review,
  });
}