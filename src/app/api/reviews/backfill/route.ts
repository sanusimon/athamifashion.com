import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REVIEW_ELIGIBLE_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "DELIVERED_TO_CUSTOMER",
]);

const BATCH_SIZE = 15;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getProductId(item: any): string | null {
  const candidates = [
    item?.rootCatalogItemId,
    item?.catalogReference?.catalogItemId,
    item?.catalogItemId,
    item?.productId,
    item?.productCatalogId,
    item?.catalogItem?.id,
    item?.product?.id,
  ];

  for (const value of candidates) {
    const id = cleanString(value);
    if (id) return id;
  }

  return null;
}

function getEmail(order: any): string {
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

    if (id) return id;
  }

  return "";
}

function getStatus(order: any): string {
  const candidates = [
    order?.fulfillmentStatus,
    order?.status,
    order?.fulfillment?.status,
    order?.fulfillments?.[0]?.status,
  ];

  for (const value of candidates) {
    const status = cleanString(value).toUpperCase();

    if (status) return status;
  }

  return "";
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

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    /*
     * -------------------------------------------------------
     * AUTH
     * -------------------------------------------------------
     */

    const url = new URL(request.url);

    const secret =
      url.searchParams.get("secret") ||
      request.headers.get("x-backfill-secret");

    if (
      !process.env.REVIEWS_BACKFILL_SECRET ||
      secret !== process.env.REVIEWS_BACKFILL_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
     * -------------------------------------------------------
     * CURSOR
     * -------------------------------------------------------
     */

    const cursorParam = url.searchParams.get("cursor");

    let cursor: string | undefined =
      cursorParam || undefined;

    /*
     * -------------------------------------------------------
     * WIX CLIENT
     * -------------------------------------------------------
     */

    const wixClient = await wixClientServer();

    /*
     * -------------------------------------------------------
     * COUNTERS
     * -------------------------------------------------------
     */

    let totalOrders = 0;
    let eligibleOrders = 0;

    let created = 0;
    let sent = 0;
    let failed = 0;

    let skippedExisting = 0;
    let skippedStatus = 0;
    let skippedNoEmail = 0;
    let skippedNoProduct = 0;

    const results: any[] = [];

    /*
     * -------------------------------------------------------
     * FETCH ONE BATCH ONLY
     * -------------------------------------------------------
     */

    console.log("[reviews/backfill] fetching batch", {
      cursor: cursor || "first-page",
      batchSize: BATCH_SIZE,
    });

    const searchOptions: any = {
      cursorPaging: {
        limit: BATCH_SIZE,
      },
    };

    if (cursor) {
      searchOptions.cursorPaging.cursor = cursor;
    }

    const response: any =
      await wixClient.orders.searchOrders(searchOptions);

    const orders = Array.isArray(response?.orders)
      ? response.orders
      : [];

    const nextCursor =
      response?.metadata?.cursors?.next || undefined;

    console.log("[reviews/backfill] batch received", {
      count: orders.length,
      hasNextCursor: !!nextCursor,
    });

    /*
     * -------------------------------------------------------
     * PROCESS BATCH
     * -------------------------------------------------------
     */

    for (const order of orders) {
      totalOrders++;

      const orderId = cleanString(
        order?._id ||
          order?.id ||
          order?.orderId
      );

      if (!orderId) {
        continue;
      }

      const status = getStatus(order);

      console.log("[reviews/backfill] checking order", {
        orderId,
        status,
      });

      /*
       * Only eligible orders
       */

      if (!REVIEW_ELIGIBLE_STATUSES.has(status)) {
        skippedStatus++;

        results.push({
          orderId,
          status,
          result: "skipped-status",
        });

        continue;
      }

      eligibleOrders++;

      /*
       * Email
       */

      const email = getEmail(order);

      if (!email) {
        skippedNoEmail++;

        results.push({
          orderId,
          status,
          result: "missing-email",
        });

        continue;
      }

      /*
       * Customer
       */

      const customerId = getCustomerId(order);

      /*
       * Items
       */

      const lineItems = getLineItems(order);

      if (!lineItems.length) {
        results.push({
          orderId,
          status,
          result: "no-line-items",
        });

        continue;
      }

      /*
       * Delivery date
       */

      const deliveryDate = getDeliveryDate(order);

      /*
       * -----------------------------------------------------
       * EACH PRODUCT
       * -----------------------------------------------------
       */

      for (const lineItem of lineItems) {
        const productId = getProductId(lineItem);

        if (!productId) {
          skippedNoProduct++;

          results.push({
            orderId,
            email,
            result: "missing-product-id",
          });

          continue;
        }

        /*
         * ---------------------------------------------------
         * DUPLICATE CHECK
         * ---------------------------------------------------
         */

        const existing =
          await getReviewRequestByOrderAndProduct(
            orderId,
            productId
          );

        if (existing) {
          skippedExisting++;

          /*
           * Existing pending request:
           * send it now.
           */

          if (
            existing.status === "pending" &&
            existing.customerEmail
          ) {
            try {
              const emailResult =
                await sendReviewRequestEmail([
                  existing,
                ]);

              if (emailResult.success) {
                await markReviewRequestSent(
                  existing.token
                );

                sent++;

                results.push({
                  orderId,
                  productId,
                  email: existing.customerEmail,
                  result: "existing-pending-sent",
                });
              } else {
                failed++;

                results.push({
                  orderId,
                  productId,
                  email: existing.customerEmail,
                  result: "existing-pending-email-failed",
                  error: emailResult.error,
                });
              }
            } catch (error) {
              failed++;

              results.push({
                orderId,
                productId,
                email: existing.customerEmail,
                result: "existing-pending-email-exception",
                error: String(error),
              });
            }
          } else {
            results.push({
              orderId,
              productId,
              result: "already-exists",
              existingStatus: existing.status,
            });
          }

          continue;
        }

        /*
         * ---------------------------------------------------
         * CREATE
         * ---------------------------------------------------
         */

        let reviewRequest;

        try {
          reviewRequest =
            await createReviewRequest({
              orderId,
              productId,
              customerId,
              customerEmail: email,
              deliveryDate,
              sendAt: new Date().toISOString(),
            });

          created++;
        } catch (error) {
          failed++;

          results.push({
            orderId,
            productId,
            email,
            result: "create-failed",
            error: String(error),
          });

          continue;
        }

        /*
         * ---------------------------------------------------
         * SEND IMMEDIATELY
         * ---------------------------------------------------
         */

        try {
          const emailResult =
            await sendReviewRequestEmail([
              reviewRequest,
            ]);

          if (emailResult.success) {
            await markReviewRequestSent(
              reviewRequest.token
            );

            sent++;

            results.push({
              orderId,
              productId,
              email,
              result: "created-and-sent",
            });
          } else {
            failed++;

            results.push({
              orderId,
              productId,
              email,
              result: "email-failed",
              error: emailResult.error,
            });
          }
        } catch (error) {
          failed++;

          results.push({
            orderId,
            productId,
            email,
            result: "email-exception",
            error: String(error),
          });
        }
      }
    }

    const elapsedMs = Date.now() - startedAt;

    console.log("[reviews/backfill] batch complete", {
      totalOrders,
      eligibleOrders,
      created,
      sent,
      failed,
      skippedExisting,
      skippedStatus,
      skippedNoEmail,
      skippedNoProduct,
      elapsedMs,
      hasNextCursor: !!nextCursor,
    });

    return NextResponse.json({
      success: true,

      batchSize: BATCH_SIZE,

      totalOrders,
      eligibleOrders,

      created,
      sent,
      failed,

      skippedExisting,
      skippedStatus,
      skippedNoEmail,
      skippedNoProduct,

      hasMore: !!nextCursor,
      nextCursor: nextCursor || null,

      elapsedMs,

      results,
    });
  } catch (error) {
    console.error(
      "[reviews/backfill] fatal error",
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