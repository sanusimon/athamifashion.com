import { NextResponse } from "next/server";
import { getPendingReviews } from "@/lib/reviewService";

export async function GET() {
  const reviews = await getPendingReviews();
  return NextResponse.json({ reviews });
}
