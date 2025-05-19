// /app/api/apply-coupon/route.ts

import { wixClientServer } from "@/lib/wixClientServer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { couponCode } = await req.json();
  const cookieStore = cookies();
  const token = cookieStore.get("refreshToken")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const refreshToken = JSON.parse(token);
  const wixClient = await wixClientServer(refreshToken);

  try {
    const cart = await wixClient.currentCart.applyCouponToCurrentCart({ couponCode });
    return NextResponse.json({ success: true, cart });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
