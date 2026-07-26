import wixClientServer from "@/lib/wixClientServer";

export async function insert(collectionId: string, data: any) {
  try {
    const wixClient = await wixClientServer();

    const result = await wixClient.items.insert(collectionId, {
      data,
    });

    return result;
  } catch (err) {
    console.error("INSERT ERROR:", err);
    throw err;
  }
}

export async function getAll(collectionId: string): Promise<any[]> {
  const wixClient = await wixClientServer();

  const result = await wixClient.items
    .query(collectionId)
    .find();

  return (result.items ?? []).map((item: any) => ({
    _id: item._id,
    ...item.data,
  }));
}

export async function query<T>(
  collectionId: string,
  field: string,
  value: any
): Promise<T[]> {
  const wixClient = await wixClientServer();

  const result = await wixClient.items
    .query(collectionId)
    .find();

  const filtered = (result.items ?? []).filter(
    (item: any) => item.data?.[field] === value
  );

  return filtered.map((item: any) => ({
    _id: item._id,
    ...item.data,
  })) as T[];
}

export async function update(
  collectionId: string,
  id: string,
  data: any
) {
  const wixClient = await wixClientServer();

  return wixClient.items.update(collectionId, {
    _id: id,
    data,
  });
}