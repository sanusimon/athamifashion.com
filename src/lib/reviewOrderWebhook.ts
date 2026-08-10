import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";

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

function getOrderId(body: any): string {
  const order =
    body?.order ||
    body?.data?.order ||
    body?.data?.resource ||
    body?.resource ||
    body;

  return cleanString(
    order?._id ||
      order?.id ||
      order?.orderId ||
      order?.order?.id
  );
}

function getOrderStatus(order: any): string {
  const candidates = [
    order?.fulfillmentStatus,
    order?.status,
    order?.fulfillment?.status,
    order?.fulfillment?.fulfillmentStatus,
    order?.fulfillments?.[0]?.status,
    order?.fulfillments?.[0]?.fulfillmentStatus,
  ];

  for (const value of candidates) {
    const status = cleanString(value).toUpperCase();

    if (status) {
      return status;
    }
  }

  return "";
}

function getCustomerEmail(order: any): string {
  const candidates = [
    order?.buyerInfo?.email,
    order?.buyerInfo?.contactDetails?.email,
    order?.contactDetails?.email,
    order?.recipientInfo?.contactDetails?.email,
    order?.recipientInfo?.email,
    order?.billingInfo?.contactDetails?.email,
    order?.shippingInfo?.contactDetails?.email,
    order?.customer?.email,
    order?.customerEmail,
  ];

  for (const value of candidates) {
    const email = cleanString(value);

    if (email && email.includes("@")) {
      return email;
    }
  }

  return "";
}

function getCustomerId(order: any): string {
  const candidates = [
    order?.buyerInfo?.contactId,
    order?.buyerInfo?.memberId,
    order?.buyerInfo?.contactDetails?.contactId,
    order?.recipientInfo?.contactDetails?.contactId,
    order?.recipientInfo?.contactId,
    order?.customer?.contactId,
    order?.customerId,
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
  if (Array.isArray(order?.lineItems)) {
    return order.lineItems;
  }

  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.purchaseUnits)) {
    const items: any[] = [];

    for (const unit of order.purchaseUnits) {
      if (Array.isArray(unit?.lineItems)) {
        items.push(...unit.lineItems);
      }
    }

    return items;
  }

  return [];
}

function getProductId(lineItem: any): string | null {
  const candidates = [
    lineItem?.rootCatalogItemId,
    lineItem?.catalogReference?.catalogItemId,
    lineItem?.catalogItemId,
    lineItem?.productId,
    lineItem?.productCatalogId,
    lineItem?.catalogItem?.id,
    lineItem?.product?.id,
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

    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

export async function handleOrderReviewWebhook(
  request: Request
) {
  try {
    const body = await request.json();

    console.log(
      "[review-webhook] webhook received"
    );

    /*
     * --------------------------------------------------
     * 1. GET ORDER ID FROM WEBHOOK
     * --------------------------------------------------
     */

    const orderId = getOrderId(body);

    console.log(
      "[review-webhook] webhook order id:",
      orderId
    );

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing order id",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * 2. GET LATEST ORDER FROM WIX
     * --------------------------------------------------
     *
     * This is the important change.
     */

    const wixClient = await wixClientServer();

    let order: any = null;

    try {
      order =
        await wixClient.orders.getOrder(
          orderId
        );
    } catch (error) {
      console.error(
        "[review-webhook] failed to fetch order from Wix",
        {
          orderId,
          error,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to fetch order from Wix",
          orderId,
        },
        { status: 500 }
      );
    }

    /*
     * Some Wix responses may wrap the order.
     */

    order =
      order?.order ||
      order?.data ||
      order;

    /*
     * --------------------------------------------------
     * 3. GET LATEST STATUS
     * --------------------------------------------------
     */

    const orderStatus =
      getOrderStatus(order);

    console.log(
      "[review-webhook] latest Wix order status",
      {
        orderId,
        orderStatus,
      }
    );

    /*
     * --------------------------------------------------
     * 4. ONLY FULFILLED ORDERS
     * --------------------------------------------------
     */

    if (
      !REVIEW_ELIGIBLE_STATUSES.has(
        orderStatus
      )
    ) {
      console.log(
        "[review-webhook] order not eligible",
        {
          orderId,
          orderStatus,
        }
      );

      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "order-status",
        orderId,
        orderStatus,
        created: 0,
        sent: 0,
      });
    }

    /*
     * --------------------------------------------------
     * 5. CUSTOMER INFORMATION
     * --------------------------------------------------
     */

    const customerEmail =
      getCustomerEmail(order);

    const customerId =
      getCustomerId(order);

    if (!customerEmail) {
      console.error(
        "[review-webhook] customer email missing",
        {
          orderId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: "Customer email not found",
          orderId,
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * 6. GET PRODUCTS
     * --------------------------------------------------
     */

    const lineItems =
      getLineItems(order);

    console.log(
      "[review-webhook] line items",
      {
        orderId,
        count: lineItems.length,
      }
    );

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

    const deliveryDate =
      getDeliveryDate(order);

    let created = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    /*
     * --------------------------------------------------
     * 7. PROCESS EVERY PRODUCT
     * --------------------------------------------------
     */

    for (const lineItem of lineItems) {
      const productId =
        getProductId(lineItem);

      if (!productId) {
        console.warn(
          "[review-webhook] product id missing",
          {
            orderId,
          }
        );

        continue;
      }

      console.log(
        "[review-webhook] processing",
        {
          orderId,
          productId,
          customerEmail,
        }
      );

      /*
       * ------------------------------------------------
       * 8. DUPLICATE CHECK
       * ------------------------------------------------
       */

      const existing =
        await getReviewRequestByOrderAndProduct(
          orderId,
          productId
        );

      if (existing) {
        console.log(
          "[review-webhook] request already exists",
          {
            orderId,
            productId,
            status: existing.status,
          }
        );

        /*
         * If an old request is pending,
         * send it now.
         */

        if (
          existing.status === "pending"
        ) {
          try {
            const emailResult =
              await sendReviewRequestEmail([
                existing,
              ]);

            if (
              emailResult.success
            ) {
              await markReviewRequestSent(
                existing.token
              );

              sent++;

              console.log(
                "[review-webhook] existing pending request sent",
                {
                  orderId,
                  productId,
                }
              );
            } else {
              failed++;
            }
          } catch (error) {
            failed++;

            console.error(
              "[review-webhook] existing request failed",
              {
                orderId,
                productId,
                error,
              }
            );
          }
        } else {
          skipped++;
        }

        continue;
      }

      /*
       * ------------------------------------------------
       * 9. CREATE REVIEW REQUEST
       * ------------------------------------------------
       */

      let reviewRequest;

      try {
        reviewRequest =
          await createReviewRequest({
            orderId,
            productId,
            customerId,
            customerEmail,
            deliveryDate,
            sendAt:
              new Date().toISOString(),
          });

        created++;

        console.log(
          "[review-webhook] ReviewRequest created",
          {
            orderId,
            productId,
            token:
              reviewRequest.token,
          }
        );
      } catch (error) {
        failed++;

        console.error(
          "[review-webhook] create request failed",
          {
            orderId,
            productId,
            error,
          }
        );

        continue;
      }

      /*
       * ------------------------------------------------
       * 10. SEND EMAIL IMMEDIATELY
       * ------------------------------------------------
       */

      try {
        const emailResult =
          await sendReviewRequestEmail([
            reviewRequest,
          ]);

        if (!emailResult.success) {
          failed++;

          console.error(
            "[review-webhook] email failed",
            {
              orderId,
              productId,
              error:
                emailResult.error,
            }
          );

          continue;
        }

        /*
         * Only mark as sent AFTER email success.
         */

        await markReviewRequestSent(
          reviewRequest.token
        );

        sent++;

        console.log(
          "[review-webhook] email sent successfully",
          {
            orderId,
            productId,
            customerEmail,
          }
        );
      } catch (error) {
        failed++;

        console.error(
          "[review-webhook] email exception",
          {
            orderId,
            productId,
            error,
          }
        );
      }
    }

    /*
     * --------------------------------------------------
     * 11. FINAL RESPONSE
     * --------------------------------------------------
     */

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
      "[review-webhook] fatal error",
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