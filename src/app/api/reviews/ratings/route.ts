import { NextResponse } from "next/server";
import { getRatingSummariesByProductIds } from "@/lib/reviewService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "Missing product ids." }, { status: 400 });
  }

  const productIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
  const summaries = await getRatingSummariesByProductIds(productIds);
  return NextResponse.json({ summaries });
}
