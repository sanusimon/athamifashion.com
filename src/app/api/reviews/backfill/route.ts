import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";
import { getReviewRequestByOrderAndProduct, createReviewRequest, markReviewRequestSent } from '@/lib/reviewService';
import { sendReviewRequestEmail } from '@/lib/emailService';

const ALLOWED_STATUSES = new Set([
  "APPROVED",              // Add this for testing
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED_TO_CUSTOMER",
]);

function getProductIdFromLineItem(item: any): string | null {
  if (!item) return null;
  return item.productId || item.catalogItemId || item.productCatalogId || item.catalogItem?.id || item.product?.id || item._id || null;
}

function hasEmailBeenSentByMetadata(order: any): boolean {
  return Boolean(order?.metadata?.reviewEmailSent || order?.metadata?.reviewEmailSent === true);
}

async function runBackfill(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-backfill-secret');
  if (!secret || secret !== process.env.REVIEWS_BACKFILL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wixClient = await wixClientServer();
  let nextCursor: string | null = null;
  const pageSize = 50;
  let totalProcessed = 0;
  let totalSent = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const sentSamples: Array<{ orderId: string; requestId: string }> = [];
  const skippedSamples: Array<{ orderId: string; reason: string }> = [];
  const failedSamples: Array<{ orderId: string; error: string }> = [];

  while (true) {
    let res: any;
    try {
      res = await wixClient.orders.searchOrders({ cursorPaging: { limit: pageSize, cursor: nextCursor } });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch orders from Wix', details: String(err) }, { status: 500 });
    }

    const orders = Array.isArray(res?.orders) ? res.orders : [];
    if (!orders.length) break;

    for (const order of orders) {
      totalProcessed++;

      const status = (order.status || '').toString().toUpperCase();
      if (!ALLOWED_STATUSES.has(status)) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: `status ${order.status || 'undefined'}` });
        continue;
      }

      if (hasEmailBeenSentByMetadata(order)) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: 'metadata reviewEmailSent' });
        continue;
      }

      const lineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
      if (!lineItems.length) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: 'no line items' });
        continue;
      }

      let alreadyRequested = false;
      for (const li of lineItems) {
        const pid = getProductIdFromLineItem(li);
        if (!pid) continue;
        const existing = await getReviewRequestByOrderAndProduct(order._id, pid);
        if (existing) {
          alreadyRequested = true;
          break;
        }
      }

      if (alreadyRequested) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: 'existing review request' });
        continue;
      }

      let primaryProductId: string | null = null;
      for (const li of lineItems) {
        const pid = getProductIdFromLineItem(li);
        if (pid) {
          primaryProductId = pid;
          break;
        }
      }

      if (!primaryProductId) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: 'no valid product id' });
        continue;
      }

      const customerId = order.buyerInfo?.contactId || order.buyerInfo?.memberId || '';
      const customerEmail = order.buyerInfo?.email || order.buyerInfo?.contactEmail || '';
      const deliveryDate = order.purchasedDate || new Date().toISOString();

      if (!customerEmail) {
        totalSkipped++;
        skippedSamples.push({ orderId: order._id, reason: 'missing customer email' });
        continue;
      }

      try {
        const reviewRequest = await createReviewRequest({
          orderId: order._id,
          productId: primaryProductId,
          customerId: customerId || '',
          customerEmail,
          deliveryDate,
          sendAt: new Date().toISOString(),
        });

        const emailResult = await sendReviewRequestEmail(reviewRequest);
        if (emailResult && emailResult.success) {
          await markReviewRequestSent(reviewRequest.token);
          totalSent++;
          sentSamples.push({ orderId: order._id, requestId: reviewRequest.id });

          try {
            if ((wixClient.orders as any)?.updateOrder) {
              await (wixClient.orders as any).updateOrder(order._id, { metadata: { reviewEmailSent: true } });
            }
          } catch (orderMarkErr) {
            console.warn('Failed to mark order with reviewEmailSent flag', order._id, String(orderMarkErr));
          }
        } else {
          totalFailed++;
          failedSamples.push({ orderId: order._id, error: JSON.stringify(emailResult) });
        }
      } catch (err) {
        console.error('Failed to create/send for order', order._id, err);
        totalFailed++;
        failedSamples.push({ orderId: order._id, error: String(err) });
      }
    }

    nextCursor = res?.pagingMetadata?.nextCursor || null;
    if (!nextCursor) break;
  }

  return NextResponse.json({
    processed: totalProcessed,
    sent: totalSent,
    skipped: totalSkipped,
    failed: totalFailed,
    sentSamples,
    skippedSamples,
    failedSamples,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run the one-time backfill. Example: POST /api/reviews/backfill?secret=YOUR_SECRET',
  });
}

export async function POST(request: Request) {
  return runBackfill(request);
}
