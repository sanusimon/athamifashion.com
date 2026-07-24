import { items } from "@wix/data";
import wixClientServer from "@/lib/wixClientServer";


export async function insert(collectionId: string, data: any) {
  try {
    const wixClient = await wixClientServer();

    const result = await wixClient.items.insert(collectionId, {
      data,
    });

    console.log("========== INSERT RESULT ==========");
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (err) {
    console.error("INSERT ERROR:", err);
    throw err;
  }
}


export async function query<T>(
  collectionId: string,
  field: string,
  value: any
): Promise<T[]> {
  const wixClient = await wixClientServer();

  // Get all records first
  const result = await wixClient.items
    .query(collectionId)
    .find();

  console.log("=================================");
  console.log("Collection:", collectionId);
  console.log("Searching:", field, "=", value);
  console.log("All records:", JSON.stringify(result.items, null, 2));

  const filtered = (result.items ?? []).filter((item: any) => {
    return item.data?.[field] === value;
  });

  console.log("Matched records:", JSON.stringify(filtered, null, 2));

  return filtered.map((item: any) => ({
    _id: item._id,
    ...item.data,
  })) as T[];
}

export async function update(collectionId: string, id: string, data: any) {
  const wixClient = await wixClientServer();

  return wixClient.items.update(collectionId, {
    _id: id,
    data,
  });
}