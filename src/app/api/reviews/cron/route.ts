import { NextResponse } from "next/server";
import {
  getPendingReviewRequestsGroupedByOrder,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (
    cronSecret &&
    (!authHeader || authHeader !== `Bearer ${cronSecret}`)
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const grouped = await getPendingReviewRequestsGroupedByOrder();

    let pending = 0;
    let sent = 0;
    let failed = 0;

    const results = [];

    for (const orderId in grouped) {
      const requests = grouped[orderId];

      pending += requests.length;

      try {
        const emailResult = await sendReviewRequestEmail(requests);

        if (emailResult.success) {
          for (const request of requests) {
            await markReviewRequestSent(request.token);
          }

          sent++;

          results.push({
            orderId,
            email: requests[0].customerEmail,
            products: requests.length,
            status: "sent",
          });
        } else {
          failed++;

          results.push({
            orderId,
            email: requests[0].customerEmail,
            products: requests.length,
            status: "failed",
          });
        }
      } catch (err) {
        failed++;

        results.push({
          orderId,
          email: requests[0].customerEmail,
          products: requests.length,
          status: "failed",
          error: String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pending,
      emailsSent: sent,
      failed,
      results,
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