import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
} from "@/lib/reviewService";



function getProductId(item: any): string | null {
  return (
    item?.productId ||
    item?.catalogItemId ||
    item?.productCatalogId ||
    item?.catalogItem?.id ||
    item?.product?.id ||
    null
  );
}

export async function POST(req: Request) {
  try {
  const url = new URL(req.url);

  const secret =
    url.searchParams.get("secret") ||
    req.headers.get("x-backfill-secret");

  if (secret !== process.env.REVIEWS_BACKFILL_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const wixClient = await wixClientServer();

  const results: any[] = [];
  
  let totalOrders = 0;
  let eligibleOrders = 0;
  let skippedStatus = 0;
  let skippedNoEmail = 0;
  let skippedNoProduct = 0;
  let skippedExisting = 0;

  let cursor: string | undefined;

  do {

    const response = await wixClient.orders.searchOrders({
      cursorPaging: {
        limit: 100,
        ...(cursor ? { cursor } : {}),
      },
    });

    const orders = response.orders || [];

    const nextCursor = (response as any).metadata?.cursors?.next;
    cursor = nextCursor;
    
    for (const order of orders) {
      
    
    totalOrders++;
    
   const fulfillmentStatus = String(
  (order as any).fulfillmentStatus || ""
).toUpperCase();

if (fulfillmentStatus !== "FULFILLED") {
  skippedStatus++;
  continue;
}

  eligibleOrders++;

  const email = order.buyerInfo?.email;

  if (!email) {
    skippedNoEmail++;
    continue;
  }

  const lineItems = order.lineItems || [];

  for (const item of lineItems) {

    const productId = getProductId(item);

    if (!productId) {
      skippedNoProduct++;
      continue;
    }

    const existing =
      await getReviewRequestByOrderAndProduct(
        order._id!,
        productId
      );

    if (existing) {
      skippedExisting++;
      continue;
    }

    const rawDeliveryDate =
      (order as any).fulfillment?.deliveredDate ||
      order.purchasedDate ||
      order._createdDate;

    const deliveryDate = rawDeliveryDate
      ? new Date(rawDeliveryDate).toISOString()
      : new Date().toISOString();

    const request = await createReviewRequest({
      orderId: order._id!,
      productId,
      customerId:
        order.buyerInfo?.contactId ||
        order.buyerInfo?.memberId ||
        "",
      customerEmail: email,
      deliveryDate,
      sendAt: new Date().toISOString(),
    });

    results.push({
      orderId: order._id,
      productId,
      email,
      token: request.token,
    });
  }
}

  } while (cursor);

  return NextResponse.json({
  success: true,
  totalOrders,
  eligibleOrders,
  created: results.length,
  skippedExisting,
  skippedStatus,
  skippedNoEmail,
  skippedNoProduct,
  requests: results,
});
}catch (err) {

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