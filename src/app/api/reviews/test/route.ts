import { NextResponse } from "next/server";
import  wixClientServer  from '@/lib/wixClientServer';
import { getReviewRequestByOrderAndProduct, createReviewRequest, markReviewRequestSent } from '@/lib/reviewService';
import { sendReviewRequestEmail } from '@/lib/emailService';

const ALLOWED_STATUSES = new Set([
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

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-backfill-secret');
  if (!secret || secret !== process.env.REVIEWS_BACKFILL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized', required: 'REVIEWS_BACKFILL_SECRET' }, { status: 401 });
  }

  const results: any = {
    step: [],
    config_status: {},
    test_email_sent: false,
    first_order_found: null,
  };

  // 1. Check configuration
  const wixAppId = process.env.WIX_APP_ID || process.env.NEXT_PUBLIC_WIX_APP_ID;
  results.config_status.EMAIL_HOST = !!process.env.EMAIL_HOST ? 'configured' : 'missing';
  results.config_status.EMAIL_USER = !!process.env.EMAIL_USER ? 'configured' : 'missing';
  results.config_status.EMAIL_PASS = !!process.env.EMAIL_PASS ? 'configured' : 'missing';
  results.config_status.EMAIL_PORT = process.env.EMAIL_PORT || 'default (587)';
  results.config_status.EMAIL_SECURE = process.env.EMAIL_SECURE || 'default (false)';
  results.config_status.EMAIL_FROM = !!process.env.EMAIL_FROM ? 'configured' : 'default (no-reply@athamifashion.com)';
  results.config_status.WIX_APP_ID = !!wixAppId ? 'configured' : 'missing';
  results.config_status.WIX_APP_SECRET = !!process.env.WIX_APP_SECRET ? 'configured' : 'missing';
  results.config_status.WIX_REFRESH_TOKEN = !!process.env.WIX_REFRESH_TOKEN ? 'configured' : 'missing (optional if WIX_INSTANCE_ID is provided)';
  results.config_status.WIX_INSTANCE_ID = !!process.env.WIX_INSTANCE_ID ? 'configured' : 'missing (optional if WIX_REFRESH_TOKEN is provided)';
  results.config_status.NEXT_PUBLIC_WIX_CLIENT_ID = !!process.env.NEXT_PUBLIC_WIX_CLIENT_ID ? 'configured' : 'missing';
  results.config_status.REVIEWS_BACKFILL_SECRET = 'configured';
  results.step.push('✅ Configuration check complete');

  // 2. Try to fetch first eligible order
  try {
    console.log("STEP 1 - Creating Wix client");

const wixClient = await wixClientServer();

console.log("STEP 2 - Wix client created");

console.log("Available modules:", Object.keys(wixClient));

console.log("STEP 3 - Calling searchOrders");

const res = await wixClient.orders.searchOrders({
  cursorPaging: { limit: 1 },
});

console.log("STEP 4 - searchOrders completed");
    const orders = Array.isArray(res?.orders) ? res.orders : [];

    if (orders.length === 0) {
      results.step.push('⚠️  No orders found in Wix');
      return NextResponse.json(results);
    }

    const order = orders[0];
    const status = (order.status || '').toString().toUpperCase();
    const lineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
    console.log("=================================");
    console.log("LINE ITEMS");
    console.log(JSON.stringify(lineItems, null, 2));
    console.log("=================================");

    results.first_order_found = {
      id: order._id,
      status,
      lineItemCount: lineItems.length,
      buyerEmail: order.buyerInfo?.email || 'missing',
      eligible: ALLOWED_STATUSES.has(status) && lineItems.length > 0,
    };
    results.step.push(`✅ Found first order: ${order._id} (status: ${status})`);

    if (!ALLOWED_STATUSES.has(status)) {
      results.step.push(`⚠️  Order status not in allowed list. Allowed: ${Array.from(ALLOWED_STATUSES).join(', ')}`);
      return NextResponse.json(results);
    }

    if (!lineItems.length) {
      results.step.push('⚠️  Order has no line items');
      return NextResponse.json(results);
    }

    const customerEmail = order.buyerInfo?.email;
    if (!customerEmail) {
      results.step.push('⚠️  Order has no customer email');
      return NextResponse.json(results);
    }

    // 3. Check if already has review request
    let productId: string | null = null;
    for (const li of lineItems) {
      const pid = getProductIdFromLineItem(li);
      if (pid) {
        productId = pid;
        break;
      }
    }

    if (!productId) {
      results.step.push('⚠️  No valid product ID found in line items');
      return NextResponse.json(results);
    }

    if (!order._id) {
      results.step.push('⚠️  Order has no ID');
      return NextResponse.json(results);
    }

   const existing = await getReviewRequestByOrderAndProduct(
  order._id,
  productId
);
console.log("========== LINE ITEM ==========");
console.log(JSON.stringify(lineItems, null, 2));

console.log("========== PRODUCT ID ==========");
console.log(productId);

console.log("EXISTING =", JSON.stringify(existing, null, 2));

results.existing = existing;

let reviewRequest;

if (existing) {
  reviewRequest = existing;
  results.step.push("ℹ Existing review request found");
} else {
  const customerId =
    order.buyerInfo?.contactId ||
    order.buyerInfo?.memberId ||
    "";

  const deliveryDate =
    typeof order.purchasedDate === "string"
      ? order.purchasedDate
      : order.purchasedDate instanceof Date
      ? order.purchasedDate.toISOString()
      : new Date().toISOString();

  reviewRequest = await createReviewRequest({
    orderId: order._id,
    productId,
    customerId,
    customerEmail,
    deliveryDate,
    sendAt: new Date().toISOString(),
  });

  results.step.push(
    `✅ Created review request with token: ${reviewRequest.token.substring(0, 8)}...`
  );
}

    const emailResult = await sendReviewRequestEmail([reviewRequest]);
    if (emailResult && emailResult.success) {
      await markReviewRequestSent(reviewRequest.token);
      results.step.push(`✅ Test email sent to: ${customerEmail}`);
      results.test_email_sent = true;

      if (emailResult.fallback) {
        results.step.push('ℹ️  Using fallback console log (SMTP not configured)');
      } else {
        results.step.push('✅ Email sent via SMTP (Gmail configured)');
      }
    } else {
      results.step.push(`❌ Email send failed: ${JSON.stringify(emailResult)}`);
      results.test_email_sent = false;
    }

    results.step.push('✅ Test complete');
    return NextResponse.json(results);
  } catch (err) {
    results.step.push(`❌ Error: ${String(err)}`);
    return NextResponse.json(results, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Send test email and verify configuration',
    usage: 'POST /api/reviews/test?secret=YOUR_SECRET',
  });
}
