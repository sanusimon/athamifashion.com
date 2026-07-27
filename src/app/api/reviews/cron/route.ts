import { NextResponse } from "next/server";
import { getPendingReviewRequests } from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";
import { markReviewRequestSent } from "@/lib/reviewService";

/**
 * Vercel Cron Job: Send pending review request emails
 * 
 * This endpoint is triggered automatically by Vercel on a schedule (e.g., every hour).
 * It finds all review requests with sendAt <= now and sends them via email.
 * 
 * To enable this in vercel.json:
 * 
 * "crons": [
 *   {
 *     "path": "/api/reviews/cron",
 *     "schedule": "0 * * * *"
 *   }
 * ]
 * 
 * This runs at the top of every hour (UTC).
 */
export async function GET(request: Request) {
  // Verify this is called by Vercel (optional, for production security)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pending = await getPendingReviewRequests();
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const request of pending) {
      try {
        const emailResult = await sendReviewRequestEmail(request);
        if (emailResult && emailResult.success) {
          await markReviewRequestSent(request.token);
          results.push({
            requestId: request.id,
            orderId: request.orderId,
            customerEmail: request.customerEmail,
            status: 'sent',
          });
          sent++;
        } else {
          results.push({
            requestId: request.id,
            orderId: request.orderId,
            customerEmail: request.customerEmail,
            status: 'failed',
            error: JSON.stringify(emailResult),
          });
          failed++;
        }
      } catch (err) {
        results.push({
          requestId: request.id,
          orderId: request.orderId,
          customerEmail: request.customerEmail,
          status: 'failed',
          error: String(err),
        });
        failed++;
      }
    }

    console.log(`[Cron] Review email batch: sent=${sent}, failed=${failed}, total=${pending.length}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pending: pending.length,
      sent,
      failed,
      results,
    });
  } catch (err) {
    console.error('[Cron] Error sending review emails:', err);
    return NextResponse.json(
      { error: String(err), timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
