import { NextResponse } from "next/server";
import { getPendingReviewRequests } from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";
import { markReviewRequestSent } from "@/lib/reviewService";

export async function POST() {
  const pending = await getPendingReviewRequests();
  const results = [];

  for (const request of pending) {
    const emailResult = await sendReviewRequestEmail([request]);
    await markReviewRequestSent(request.token);
    results.push({ requestId: request.id, emailResult });
  }

  return NextResponse.json({ sent: results.length, results });
}
