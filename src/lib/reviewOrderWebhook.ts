import { NextResponse } from "next/server";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

const REVIEW_ELIGIBLE_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "DELIVERED_TO_CUSTOMER",
]);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getOrderFromPayload(body: any): any {
  if (body?.order) return body.order;
  if (body?.data?.order) return body.data.order;
  if (body?.data?.resource) return body.data.resource;
  if (body?.resource) return body.resource;

  return body;
}

function getOrderId(order: any): string {
  return cleanString(
    order?._id ||
      order?.id ||
      order?.orderId ||
      order?.order?.id
  );
}

function getOrderStatus(order: any): string {
  const values = [
    order?.fulfillmentStatus,
    order?.status,
    order?.fulfillment?.status,
    order?.fulfillments?.[0]?.status,
    order?.fulfillment?.fulfillmentStatus,
  ];

  for (const value of values) {
    const status = cleanString(value).toUpperCase();

    if (status) {
      return status;
    }
  }

  return "";
}

function getCustomerEmail(order: any, body: any): string {
  const candidates = [
    order?.buyerInfo?.email,
    order?.buyerInfo?.contactDetails?.email,
    order?.contactDetails?.email,
    order?.recipientInfo?.contactDetails?.email,
    order?.billingInfo?.contactDetails?.email,
    order?.shippingInfo?.contactDetails?.email,
    order?.customer?.email,
    order?.customerEmail,
    body?.customerEmail,
    body?.email,
    body?.data?.customerEmail,
  ];

  for (const value of candidates) {
    const email = cleanString(value);

    if (email && email.includes("@")) {
      return email;
    }
  }

  return "";
}

function getCustomerId(order: any, body: any): string {
  const candidates = [
    order?.buyerInfo?.contactId,
    order?.buyerInfo?.memberId,
    order?.buyerInfo?.contactDetails?.contactId,
    order?.recipientInfo?.contactDetails?.contactId,
    order?.customer?.contactId,
    order?.customerId,
    body?.customerId,
    body?.data?.customerId,
  ];

  for (const value of candidates) {
    const id = cleanString(value);

    if (id) {
      return id;
    }
  }

  return "";
}

function getLineItems(order: any): any[] {
  const candidates = [
    order?.lineItems,
    order?.purchaseUnits?.flatMap(
      (unit: any) => unit?.lineItems || []
    ),
    order?.items,
  ];

  for (const value of candidates) {
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [];
}

function getProductIdFromLineItem(item: any): string | null {
  const candidates = [
    item?.rootCatalogItemId,
    item?.catalogReference?.catalogItemId,
    item?.catalogReference?.catalogItemId,
    item?.catalogItemId,
    item?.productId,
    item?.productCatalogId,
    item?.catalogItem?.id,
    item?.product?.id,
  ];

  for (const value of candidates) {
    const id = cleanString(value);

    if (id) {
      return id;
    }
  }

  return null;
}

function getDeliveryDate(order: any): string {
  const candidates = [
    order?.fulfillment?.deliveredDate,
    order?.fulfillment?.deliveryDate,
    order?.fulfillments?.[0]?.deliveredDate,
    order?.fulfillments?.[0]?.deliveryDate,
    order?.deliveryDate,
    order?.deliveredDate,
    order?.purchasedDate,
    order?._createdDate,
  ];

  for (const value of candidates) {
    if (!value) continue;

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

export async function handleOrderReviewWebhook(request: Request) {
  try {
    const body = await request.json();

    console.log("[review-webhook] request received");

    const order = getOrderFromPayload(body);

    const orderId = getOrderId(order);
    const orderStatus = getOrderStatus(order);
    const customerEmail = getCustomerEmail(order, body);
    const customerId = getCustomerId(order, body);
    const lineItems = getLineItems(order);

    console.log("[review-webhook] normalized order", {
      orderId,
      orderStatus,
      customerEmail,
      customerId,
      lineItemCount: lineItems.length,
    });

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing order id",
        },
        { status: 400 }
      );
    }

    if (!REVIEW_ELIGIBLE_STATUSES.has(orderStatus)) {
      console.log("[review-webhook] skipped status", {
        orderId,
        orderStatus,
      });

      return NextResponse.json({
        success: true,
        created: 0,
        sent: 0,
        skipped: true,
        reason: "status",
        orderId,
        orderStatus,
      });
    }

    if (!customerEmail) {
      console.error("[review-webhook] customer email not found", {
        orderId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Customer email not found",
          orderId,
          orderStatus,
        },
        { status: 400 }
      );
    }

    if (!lineItems.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No line items found",
          orderId,
        },
        { status: 400 }
      );
    }

    const deliveryDate = getDeliveryDate(order);

    let created = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const lineItem of lineItems) {
      const productId = getProductIdFromLineItem(lineItem);

      console.log("[review-webhook] line item", {
        orderId,
        productId,
      });

      if (!productId) {
        console.warn("[review-webhook] product id not found", {
          orderId,
          lineItem,
        });

        continue;
      }

      const existing =
        await getReviewRequestByOrderAndProduct(
          orderId,
          productId
        );

      if (existing) {
        console.log("[review-webhook] review request already exists", {
          orderId,
          productId,
          status: existing.status,
        });

        skipped++;
        continue;
      }

      const reviewRequest = await createReviewRequest({
        orderId,
        productId,
        customerId,
        customerEmail,
        deliveryDate,
        sendAt: new Date().toISOString(),
      });

      created++;

      console.log("[review-webhook] ReviewRequest created", {
        orderId,
        productId,
        token: reviewRequest.token,
      });

      try {
        const emailResult =
          await sendReviewRequestEmail([reviewRequest]);

        if (!emailResult.success) {
          failed++;

          console.error(
            "[review-webhook] review email failed",
            {
              orderId,
              productId,
              error: emailResult.error,
            }
          );

          continue;
        }

        await markReviewRequestSent(
          reviewRequest.token
        );

        sent++;

        console.log(
          "[review-webhook] review email sent",
          {
            orderId,
            productId,
            customerEmail,
          }
        );
      } catch (emailError) {
        failed++;

        console.error(
          "[review-webhook] email exception",
          emailError
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderStatus,
      created,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error(
      "[review-webhook] failed",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}