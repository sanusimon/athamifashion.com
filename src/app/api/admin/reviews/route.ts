import { NextResponse } from "next/server";
import {
  getPendingReviewRequests,
  getPendingReviews,
} from "@/lib/reviewService";

export async function GET() {
  try {
    const requests = await getPendingReviewRequests();
    const reviews = await getPendingReviews();

    return NextResponse.json({
      requests,
      reviews,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }
}