import { NextResponse } from "next/server";
import { submitReview } from "@/lib/reviewService";

export async function POST(request: Request) {
  const body = await request.json();
  const { token, rating, text, photos } = body;

  if (!token || typeof rating !== "number" || rating < 1 || rating > 5 || typeof text !== "string") {
    return NextResponse.json({ error: "Invalid review submission payload." }, { status: 400 });
  }

  try {
    const review = await submitReview({ token, rating, text, photos: Array.isArray(photos) ? photos : [] });
    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
