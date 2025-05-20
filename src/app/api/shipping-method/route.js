import { NextResponse } from "next/server";

// POST request handler
export async function POST(request) {
  const body = await request.json();
  const { postalCode, city, country } = body;

  // Dummy logic: allow all for now
  const available = true;

  const shippingMethods = [
    {
      name: "Standard Delivery",
      eta: "3-5 days",
      cost: 50,
    },
    {
      name: "Express Delivery",
      eta: "1-2 days",
      cost: 100,
    },
  ];

  return NextResponse.json({
    success: true,
    available,
    shippingMethods,
  });
}
