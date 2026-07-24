// app/api/admin/reviews/route.ts

import { NextResponse } from "next/server";
import {
  getPendingReviewRequests,
  getPendingReviews,
} from "@/lib/reviewService";
import { query } from "@/lib/wixReviewStore";

export async function GET() {
  try {
    const requests = await query("ReviewRequests");
    const reviews = await query("Reviews");

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