import { NextResponse } from "next/server";
import { submitReview } from "@/lib/reviewService";

export async function POST(request: Request) {
  try {
    console.log("POST /api/reviews/submit");

    const body = await request.json();
    console.log("BODY:", body);

    const { token, rating, text, photos } = body;

    const review = await submitReview({
      token,
      rating,
      text,
      photos: Array.isArray(photos) ? photos : [],
    });

    console.log("SUBMIT REVIEW SUCCESS");

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (e) {
    console.error("SUBMIT REVIEW ERROR");
    console.error(e);

    return NextResponse.json(
      {
        error: String(e),
      },
      { status: 500 }
    );
  }
}