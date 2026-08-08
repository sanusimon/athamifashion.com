import { NextResponse } from "next/server";

import {
  getPendingReviewRequestsGroupedByOrder,
  markReviewRequestSent,
} from "@/lib/reviewService";

import { sendReviewRequestEmail } from "@/lib/emailService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    /*
     * ---------------------------------------------------------
     * CRON AUTHENTICATION
     * ---------------------------------------------------------
     */

    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (
      cronSecret &&
      (!authHeader || authHeader !== `Bearer ${cronSecret}`)
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
     * GET ALL PENDING REVIEW REQUESTS
     * ---------------------------------------------------------
     */

    const grouped =
      await getPendingReviewRequestsGroupedByOrder();

    let pending = 0;
    let emailsSent = 0;
    let productsSent = 0;
    let failed = 0;

    const results: any[] = [];

    /*
     * ---------------------------------------------------------
     * PROCESS EACH ORDER
     * ---------------------------------------------------------
     */

    for (const orderId of Object.keys(grouped)) {
      const requests = grouped[orderId];

      if (!Array.isArray(requests) || requests.length === 0) {
        continue;
      }

      pending += requests.length;

      const email = requests[0]?.customerEmail || "";

      console.log(
        "[reviews/send] processing order",
        {
          orderId,
          email,
          products: requests.length,
        }
      );

      /*
       * -------------------------------------------------------
       * SEND ONE EMAIL FOR THE ORDER
       * -------------------------------------------------------
       *
       * If customer bought multiple products in one order,
       * sendReviewRequestEmail(requests) should include all
       * products in the same email.
       */

      try {
        const emailResult =
          await sendReviewRequestEmail(requests);

        if (!emailResult.success) {
          failed++;

          console.error(
            "[reviews/send] email failed",
            {
              orderId,
              email,
              error: emailResult.error,
            }
          );

          results.push({
            orderId,
            email,
            products: requests.length,
            status: "failed",
            error: emailResult.error,
          });

          /*
           * IMPORTANT:
           * Do NOT mark the requests as sent.
           *
           * They remain pending and the next cron run
           * can try again.
           */

          continue;
        }

        /*
         * -----------------------------------------------------
         * EMAIL SUCCESSFUL
         * -----------------------------------------------------
         */

        for (const reviewRequest of requests) {
          try {
            await markReviewRequestSent(
              reviewRequest.token
            );

            productsSent++;
          } catch (markError) {
            console.error(
              "[reviews/send] failed to mark request as sent",
              {
                orderId,
                token: reviewRequest.token,
                error: markError,
              }
            );
          }
        }

        emailsSent++;

        results.push({
          orderId,
          email,
          products: requests.length,
          status: "sent",
        });

        console.log(
          "[reviews/send] email sent successfully",
          {
            orderId,
            email,
            products: requests.length,
          }
        );
      } catch (error) {
        failed++;

        console.error(
          "[reviews/send] email exception",
          {
            orderId,
            email,
            error,
          }
        );

        results.push({
          orderId,
          email,
          products: requests.length,
          status: "failed",
          error: String(error),
        });
      }
    }

    /*
     * ---------------------------------------------------------
     * FINAL RESPONSE
     * ---------------------------------------------------------
     */

    console.log(
      "[reviews/send] completed",
      {
        pending,
        emailsSent,
        productsSent,
        failed,
      }
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),

      pending,

      emailsSent,

      productsSent,

      failed,

      results,
    });
  } catch (error) {
    console.error(
      "[reviews/send] fatal error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}