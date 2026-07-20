import { NextResponse } from "next/server";
import { getReviewRequestByToken } from "@/lib/reviewService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const reviewRequest = await getReviewRequestByToken(token);
  if (!reviewRequest) {
    return NextResponse.json({ valid: false, error: "Invalid token." }, { status: 404 });
  }

  return NextResponse.json({ valid: true, reviewRequest: {
    productId: reviewRequest.productId,
    orderId: reviewRequest.orderId,
    customerEmail: reviewRequest.customerEmail,
    deliveryDate: reviewRequest.deliveryDate,
    status: reviewRequest.status,
  } });
}
