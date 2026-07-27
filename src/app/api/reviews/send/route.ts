import { NextResponse } from "next/server";
import {
  getPendingReviewRequests,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export async function GET(request: Request) {
  try {
    // Optional security
    const authHeader = request.headers.get("authorization");

    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pending = await getPendingReviewRequests();

    let sent = 0;
    let failed = 0;

    for (const reviewRequest of pending) {
      try {
        const result = await sendReviewRequestEmail(reviewRequest);

        if (result.success) {
          await markReviewRequestSent(reviewRequest.token);
          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      pending: pending.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      {
        status: 500,
      }
    );
  }
}
export async function POST(request: Request) {
  return GET(request);
}