import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";

export async function GET() {
  try {
    const wixClient = await wixClientServer();

    const collections = await wixClient.collections
      .queryCollections()
      .find();

    return NextResponse.json({
      success: true,
      collections: collections.items || [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      { status: 500 }
    );
  }
}