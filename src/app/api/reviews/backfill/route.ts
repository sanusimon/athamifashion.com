import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";
import {
  createReviewRequest,
  getReviewRequestByOrderAndProduct,
  markReviewRequestSent,
} from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export const dynamic = "force-dynamic";

const REVIEW_ELIGIBLE_STATUSES = new Set([
  "DELIVERED",
  "FULFILLED",
  "COMPLETED",
  "DELIVERED_TO_CUSTOMER",
]);

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

    if (id) {
      return id;
    }
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

    if (id) {
      return id;
    }
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

    if (status) {
      return status;
    }
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
    if (!value) {
      continue;
    }

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
  try {
    /*
     * ---------------------------------------------------------
     * AUTHENTICATION
     * ---------------------------------------------------------
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
     * ---------------------------------------------------------
     * WIX ADMIN CLIENT
     * ---------------------------------------------------------
     */

    const wixClient = await wixClientServer();

    /*
     * ---------------------------------------------------------
     * COUNTERS
     * ---------------------------------------------------------
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
     * ---------------------------------------------------------
     * FETCH ALL ORDERS
     * ---------------------------------------------------------
     *
     * We intentionally fetch pages of orders.
     */

    let cursor: string | undefined;

    do {
      console.log("[reviews/backfill] fetching orders", {
        cursor: cursor || "first-page",
      });

      const searchOptions: any = {
        cursorPaging: {
          limit: 100,
        },
      };

      if (cursor) {
        searchOptions.cursorPaging.cursor = cursor;
      }

      const response: any =
        await wixClient.orders.searchOrders(
          searchOptions
        );

      const orders = Array.isArray(response?.orders)
        ? response.orders
        : [];

      console.log("[reviews/backfill] orders received", {
        count: orders.length,
      });

      const nextCursor =
        response?.metadata?.cursors?.next;

      cursor = nextCursor || undefined;


      /*
       * -------------------------------------------------------
       * PROCESS ORDERS
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
          console.warn(
            "[reviews/backfill] order has no ID"
          );

          continue;
        }

        const status = getStatus(order);

        console.log(
          "[reviews/backfill] checking order",
          {
            orderId,
            status,
          }
        );

        /*
         * -----------------------------------------------------
         * ONLY FULFILLED / ELIGIBLE ORDERS
         * -----------------------------------------------------
         */

        if (!REVIEW_ELIGIBLE_STATUSES.has(status)) {
          skippedStatus++;
          continue;
        }

        eligibleOrders++;

        /*
         * -----------------------------------------------------
         * CUSTOMER EMAIL
         * -----------------------------------------------------
         */

        const email = getEmail(order);

        if (!email) {
          skippedNoEmail++;

          console.warn(
            "[reviews/backfill] customer email not found",
            {
              orderId,
              status,
            }
          );

          results.push({
            orderId,
            status,
            result: "missing-email",
          });

          continue;
        }

        /*
         * -----------------------------------------------------
         * CUSTOMER ID
         * -----------------------------------------------------
         */

        const customerId =
          getCustomerId(order);

        /*
         * -----------------------------------------------------
         * LINE ITEMS
         * -----------------------------------------------------
         */

        const lineItems =
          getLineItems(order);

        console.log(
          "[reviews/backfill] line items",
          {
            orderId,
            count: lineItems.length,
          }
        );

        if (!lineItems.length) {
          console.warn(
            "[reviews/backfill] no line items",
            {
              orderId,
            }
          );

          results.push({
            orderId,
            status,
            result: "no-line-items",
          });

          continue;
        }

        /*
         * -----------------------------------------------------
         * DELIVERY DATE
         * -----------------------------------------------------
         */

        const deliveryDate =
          getDeliveryDate(order);

        /*
         * -----------------------------------------------------
         * PROCESS EACH PRODUCT
         * -----------------------------------------------------
         */

        for (const lineItem of lineItems) {
          const productId =
            getProductId(lineItem);

          if (!productId) {
            skippedNoProduct++;

            console.warn(
              "[reviews/backfill] product ID not found",
              {
                orderId,
                lineItem,
              }
            );

            continue;
          }

          console.log(
            "[reviews/backfill] processing product",
            {
              orderId,
              productId,
              email,
            }
          );

          /*
           * ---------------------------------------------------
           * CHECK DUPLICATE
           * ---------------------------------------------------
           */

          const existing =
            await getReviewRequestByOrderAndProduct(
              orderId,
              productId
            );

          if (existing) {
            skippedExisting++;

            console.log(
              "[reviews/backfill] review request already exists",
              {
                orderId,
                productId,
                status: existing.status,
                token: existing.token,
              }
            );

            /*
             * If the request exists but is still pending,
             * send it now.
             */

            if (
              existing.status === "pending" &&
              existing.customerEmail
            ) {
              try {
                console.log(
                  "[reviews/backfill] sending existing pending request",
                  {
                    orderId,
                    productId,
                  }
                );

                const emailResult =
                  await sendReviewRequestEmail([
                    existing,
                  ]);

                if (emailResult.success) {
                  await markReviewRequestSent(
                    existing.token
                  );

                  sent++;

                  console.log(
                    "[reviews/backfill] existing request sent",
                    {
                      orderId,
                      productId,
                    }
                  );
                } else {
                  failed++;

                  console.error(
                    "[reviews/backfill] existing request email failed",
                    {
                      orderId,
                      productId,
                      error:
                        emailResult.error,
                    }
                  );
                }
              } catch (error) {
                failed++;

                console.error(
                  "[reviews/backfill] existing request email exception",
                  {
                    orderId,
                    productId,
                    error,
                  }
                );
              }
            }

            continue;
          }

          /*
           * ---------------------------------------------------
           * CREATE REVIEW REQUEST
           * ---------------------------------------------------
           *
           * IMPORTANT:
           * sendAt is NOW.
           *
           * There is NO 3-day delay.
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
                sendAt:
                  new Date().toISOString(),
              });

            created++;

            console.log(
              "[reviews/backfill] ReviewRequest created",
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
              "[reviews/backfill] createReviewRequest failed",
              {
                orderId,
                productId,
                error,
              }
            );

            results.push({
              orderId,
              productId,
              email,
              status,
              result: "create-failed",
              error: String(error),
            });

            continue;
          }

          /*
           * ---------------------------------------------------
           * SEND EMAIL IMMEDIATELY
           * ---------------------------------------------------
           */

          try {
            console.log(
              "[reviews/backfill] sending email",
              {
                orderId,
                productId,
                email,
              }
            );

            const emailResult =
              await sendReviewRequestEmail([
                reviewRequest,
              ]);

            if (emailResult.success) {
              /*
               * Only mark as sent after the email
               * service reports success.
               */

              await markReviewRequestSent(
                reviewRequest.token
              );

              sent++;

              console.log(
                "[reviews/backfill] email sent successfully",
                {
                  orderId,
                  productId,
                  email,
                }
              );

              results.push({
                orderId,
                productId,
                email,
                status,
                result:
                  "created-and-sent",
              });
            } else {
              failed++;

              console.error(
                "[reviews/backfill] email failed",
                {
                  orderId,
                  productId,
                  email,
                  error:
                    emailResult.error,
                }
              );

              results.push({
                orderId,
                productId,
                email,
                status,
                result: "email-failed",
                error:
                  emailResult.error,
              });
            }
          } catch (error) {
            failed++;

            console.error(
              "[reviews/backfill] email exception",
              {
                orderId,
                productId,
                error,
              }
            );

            results.push({
              orderId,
              productId,
              email,
              status,
              result:
                "email-exception",
              error: String(error),
            });
          }
        }
      }
    } while (cursor);

    /*
     * ---------------------------------------------------------
     * FINAL RESPONSE
     * ---------------------------------------------------------
     */

    console.log(
      "[reviews/backfill] completed",
      {
        totalOrders,
        eligibleOrders,
        created,
        sent,
        failed,
        skippedExisting,
        skippedStatus,
        skippedNoEmail,
        skippedNoProduct,
      }
    );

    return NextResponse.json({
      success: true,

      totalOrders,
      eligibleOrders,

      created,
      sent,
      failed,

      skippedExisting,
      skippedStatus,
      skippedNoEmail,
      skippedNoProduct,

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