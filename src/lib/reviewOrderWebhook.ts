import { NextResponse } from "next/server";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
} from "@/lib/reviewService";

const REVIEW_ELIGIBLE_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "DELIVERED_TO_CUSTOMER",
]);

function getProductIdFromLineItem(item: any): string | null {
  return (
    item?.rootCatalogItemId ||
    item?.catalogReference?.catalogItemId ||
    item?.catalogItemId ||
    item?.productId ||
    item?.productCatalogId ||
    item?.catalogItem?.id ||
    item?.product?.id ||
    null
  );
}

function getDeliveryDate(order: any): string | null {
  const candidates = [
    order?.fulfillment?.deliveredDate,
    order?.fulfillment?.deliveryDate,
    order?.deliveryDate,
    order?.deliveredDate,
    order?.purchasedDate,
    order?._createdDate,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

export async function handleOrderReviewWebhook(request: Request) {
  try {
    const body = await request.json();
    console.log("[review-webhook] request received");
    console.log("[review-webhook] raw payload", JSON.stringify(body, null, 2));

    const order = body?.order || body;

    if (!order?._id && !order?.id) {
      return NextResponse.json(
        { success: false, error: "Missing order id" },
        { status: 400 }
      );
    }

    const orderId = order?._id || order?.id;
    const orderStatus = String(
      order?.status || order?.fulfillmentStatus || order?.fulfillment?.status || ""
    ).toUpperCase();
    console.log("[review-webhook] detected order status", { orderId, orderStatus });
    const customerEmail =
      order?.buyerInfo?.email ||
      order?.contactDetails?.email ||
      body?.customerEmail ||
      "";
    const customerId =
      order?.buyerInfo?.contactId ||
      order?.buyerInfo?.memberId ||
      body?.customerId ||
      "";

    console.log("[review-webhook] order received", {
      orderId,
      orderStatus,
      customerEmail,
    });

    if (!REVIEW_ELIGIBLE_STATUSES.has(orderStatus)) {
      return NextResponse.json({
        success: true,
        created: 0,
        skipped: true,
        reason: "status",
        orderId,
        orderStatus,
      });
    }

    const createdRequests: any[] = [];
    const lineItems = Array.isArray(order?.lineItems) ? order.lineItems : [];
    const extractedProductIds: string[] = [];

    for (const lineItem of lineItems) {
      const productId = getProductIdFromLineItem(lineItem);
      if (productId) {
        extractedProductIds.push(productId);
      }
      console.log("[review-webhook] checking line item", {
        orderId,
        productId,
        lineItem,
      });

      if (!productId) {
        continue;
      }

      const existing = await getReviewRequestByOrderAndProduct(orderId, productId);

      if (existing) {
        console.log("[review-webhook] request already exists", {
          orderId,
          productId,
        });
        continue;
      }

      const deliveryDate = getDeliveryDate(order) || new Date().toISOString();

      console.log("[review-webhook] creating review request", {
        orderId,
        productId,
        customerEmail,
        deliveryDate,
      });

      const reviewRequest = await createReviewRequest({
        orderId,
        productId,
        customerId,
        customerEmail,
        deliveryDate,
      });

      console.log("[review-webhook] createReviewRequest returned", {
        orderId,
        productId,
        reviewRequest,
      });

      createdRequests.push(reviewRequest);
    }

    console.log("[review-webhook] extracted product ids", {
      orderId,
      extractedProductIds,
    });

    console.log("[review-webhook] completed", {
      orderId,
      created: createdRequests.length,
    });

    return NextResponse.json({
      success: true,
      created: createdRequests.length,
      orderId,
      orderStatus,
    });
  } catch (error) {
    console.error("[review-webhook] failed", error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
