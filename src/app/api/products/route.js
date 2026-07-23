import { NextResponse } from "next/server";
import wixClientServer from "@/lib/wixClientServer";

export async function GET() {
  try {
    const wixClient = await wixClientServer();

    let allProducts = [];
    let query = wixClient.products.queryProducts().limit(100);

    while (true) {
      const result = await query.find();

      allProducts.push(...(result.items || []));

      if (!result.hasNext()) {
        break;
      }

      query = result.next();
    }

    const collectionsResponse = await wixClient.collections
      .queryCollections()
      .find();

    return NextResponse.json({
      success: true,
      products: allProducts,
      collections: collectionsResponse.items || [],
    });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}