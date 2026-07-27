import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
} from "@/lib/reviewService";

const ALLOWED_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED_TO_CUSTOMER",
]);

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

  let cursor: string | undefined;

  do {

    const response = await wixClient.orders.searchOrders({
    cursorPaging: {
        limit: 100,
    },
    });

    const orders = response.orders || [];

    const nextCursor = (response as any).metadata?.cursors?.next;
    cursor = nextCursor;
        
    for (const order of orders) {

      const status = (order.status || "").toUpperCase();

      if (!ALLOWED_STATUSES.has(status))
        continue;

      const email = order.buyerInfo?.email;

      if (!email)
        continue;

      const lineItems = order.lineItems || [];

      for (const item of lineItems) {

        const productId = getProductId(item);

        if (!productId)
          continue;

        const existing =
          await getReviewRequestByOrderAndProduct(
            order._id!,
            productId
          );

        if (existing)
          continue;

        const rawDeliveryDate =
        (order as any).fulfillment?.deliveredDate ||
        order.purchasedDate ||
        order._createdDate;

        const deliveryDate = rawDeliveryDate
        ? new Date(rawDeliveryDate).toISOString()
        : new Date().toISOString();

        const request =
          await createReviewRequest({

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

    created: results.length,

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