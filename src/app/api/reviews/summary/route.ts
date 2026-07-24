import { NextResponse } from "next/server";
import { getRatingSummariesByProductIds } from "@/lib/reviewService";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const ids = searchParams.get("ids");

  console.log("IDS:", ids);

  const productIds = ids?.split(",") ?? [];

  console.log("Product IDs:", productIds);

  const summaries = await getRatingSummariesByProductIds(productIds);

  console.log("Summaries:", summaries);

  return NextResponse.json({ summaries });
}