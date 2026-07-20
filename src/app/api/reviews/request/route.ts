import { NextResponse } from "next/server";
import { createReviewRequest } from "@/lib/reviewService";
import { sendReviewRequestEmail } from "@/lib/emailService";

export async function POST(request: Request) {
  const body = await request.json();
  const { orderId, productId, customerId, customerEmail, deliveryDate } = body;

  if (!orderId || !productId || !customerId || !customerEmail || !deliveryDate) {
    return NextResponse.json({ error: "Missing required review request fields." }, { status: 400 });
  }

  const reviewRequest = await createReviewRequest({
    orderId,
    productId,
    customerId,
    customerEmail,
    deliveryDate,
  });

  const emailResult = await sendReviewRequestEmail(reviewRequest);
  return NextResponse.json({ reviewRequest, emailResult });
}
