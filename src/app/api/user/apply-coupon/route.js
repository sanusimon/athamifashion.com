import { NextResponse } from "next/server";

// GET: Return list of promotions
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");
  const customerId = searchParams.get("customer");

  console.log("Fetching promotions for", { orderId, customerId });

  // Fetch from DB or static list
  const promotions = [
    { code: "WELCOME10", discount: 10 },
    { code: "SUMMER20", discount: 20 },
  ];

  return NextResponse.json({ success: true, promotions });
}

// POST: Validate and apply coupon
export async function POST(request) {
  const body = await request.json();
  const { couponCode, orderId, customerId } = body;

  console.log("Applying coupon", couponCode, "for order", orderId);

  if (couponCode === "WELCOME10") {
    return NextResponse.json({ success: true, discountAmount: 10 });
  } else if (couponCode === "SUMMER20") {
    return NextResponse.json({ success: true, discountAmount: 20 });
  }

  return NextResponse.json({ success: false, message: "Invalid coupon" });
}
