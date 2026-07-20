import { NextResponse } from "next/server";
import { approveReview } from "@/lib/reviewService";

export async function POST(request: Request, context: any) {
  const review = await approveReview(context.params.id);
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, review });
}
