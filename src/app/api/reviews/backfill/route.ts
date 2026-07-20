import { NextResponse } from "next/server";
import { wixClientServer } from '@/lib/wixClientServer';
import { getReviewRequestByOrderAndProduct, createReviewRequest, markReviewRequestSent } from '@/lib/reviewService';
import { sendReviewRequestEmail } from '@/lib/emailService';

const ALLOWED_STATUSES = new Set(['DELIVERED', 'FULFILLED', 'COMPLETED', 'SHIPPED', 'DELIVERED_TO_CUSTOMER']);

function getProductIdFromLineItem(item: any): string | null {
  if (!item) return null;
  return item.productId || item.catalogItemId || item.productCatalogId || item.catalogItem?.id || item.product?.id || item._id || null;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-backfill-secret');
  if (!secret || secret !== process.env.REVIEWS_BACKFILL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wixClient = await wixClientServer();
  let page = 0;
  const pageSize = 50;
  let totalProcessed = 0;
  let totalSent = 0;
  let totalSkipped = 0;
  const sentSamples: Array<{ orderId: string; requestId: string }> = [];

  while (true) {
    // Try to fetch a page of orders; SDK expects a `search` object in existing code
    let res: any;
    try {
      res = await wixClient.orders.searchOrders({ limit: pageSize, page });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch orders from Wix', details: String(err) }, { status: 500 });
    }

    const orders = res?.orders || [];
    if (!orders.length) break;

    for (const order of orders) {
      totalProcessed++;

      const status = (order.status || '').toString().toUpperCase();
      if (!ALLOWED_STATUSES.has(status)) {
        totalSkipped++;
        continue;
      }

      const lineItems = order.lineItems || [];
      if (!lineItems.length) {
        totalSkipped++;
        continue;
      }

      // Check if any product in this order already has a review request
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
        continue;
      }

      // Choose primary product from first line item that provides an id
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
        continue;
      }

      const customerId = order.buyerInfo?.contactId || order.buyerInfo?.contactId || '';
      const customerEmail = order.buyerInfo?.email || order.buyerInfo?.contactEmail || '';
      const deliveryDate = order.purchasedDate || new Date().toISOString();

      try {
        const reviewRequest = await createReviewRequest({
          orderId: order._id,
          productId: primaryProductId,
          customerId: customerId || '',
          customerEmail: customerEmail || '',
          deliveryDate: deliveryDate,
          sendAt: new Date().toISOString(), // send immediately
        });

        const emailResult = await sendReviewRequestEmail(reviewRequest);
        await markReviewRequestSent(reviewRequest.token);
        totalSent++;
        sentSamples.push({ orderId: order._id, requestId: reviewRequest.id });
      } catch (err) {
        // log and continue
        console.error('Failed to create/send for order', order._id, err);
      }
    }

    page++;
  }

  return NextResponse.json({ processed: totalProcessed, sent: totalSent, skipped: totalSkipped, samples: sentSamples });
}
