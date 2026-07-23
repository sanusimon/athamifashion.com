import { items } from "@wix/data";
import wixClientServer from "@/lib/wixClientServer";


export async function insert(collectionId: string, data: any) {
  const wixClient = await wixClientServer();

  const result = await wixClient.items.insert(collectionId, {
    data,
  });

  console.log("INSERT RESULT");
  console.log(result);

  return result;
}

export async function query(
  collectionId: string,
  field: string,
  value: any
) {
  const wixClient = await wixClientServer();

  const result = await wixClient.items
    .query(collectionId)
    .eq(`data.${field}`, value)
    .find();

  return (result.items ?? []).map((item: any) => ({
    _id: item._id,
    ...item.data,
  }));
}

export async function update(collectionId: string, id: string, data: any) {
  const wixClient = await wixClientServer();

  return wixClient.items.update(collectionId, {
    _id: id,
    data,
  });
}