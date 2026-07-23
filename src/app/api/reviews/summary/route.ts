import { NextResponse } from "next/server";
import { getRatingSummariesByProductIds } from "@/lib/reviewService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const ids = searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ summaries: {} });
  }

  const productIds = ids.split(",");

  const summaries = await getRatingSummariesByProductIds(productIds);

  return NextResponse.json({ summaries });
}