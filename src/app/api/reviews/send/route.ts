import { NextResponse } from "next/server";
import {
  getPendingReviewRequestsGroupedByOrder,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export async function GET(request: Request) {
  try {
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

    const grouped = await getPendingReviewRequestsGroupedByOrder();

    const pending = Object.values(grouped).reduce(
      (count, requests) => count + requests.length,
      0
    );

    let sent = 0;
    let failed = 0;

    for (const orderId in grouped) {
      const requests = grouped[orderId];

      try {
        const result = await sendReviewRequestEmail(requests);

        if (result.success) {
          for (const request of requests) {
            await markReviewRequestSent(request.token);
          }

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
      pending,
      emailsSent: sent,
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