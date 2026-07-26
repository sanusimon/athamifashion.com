import { NextResponse } from "next/server";
import {
  getAllReviews,
  getAllReviewRequests,
} from "@/lib/reviewService";

export async function GET() {
  try {
    const requests = await getAllReviewRequests();
    const reviews = await getAllReviews();

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