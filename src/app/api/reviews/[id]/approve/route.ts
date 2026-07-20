import { NextResponse } from "next/server";
import { approveReview } from "@/lib/reviewService";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const review = await approveReview(params.id);
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, review });
}
