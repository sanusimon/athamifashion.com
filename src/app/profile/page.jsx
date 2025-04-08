import { cookies } from "next/headers";
import { wixClientServer } from "@/lib/wixClientServer";
import { updateUser } from "@/lib/action";
import { members } from "@wix/members";
import Link from "next/link";
import { format } from "timeago.js";

const ProfilePage = async () => {
  // ✅ Get refreshToken here — it's allowed in server components
  const cookieStore = cookies();
  const refreshToken = JSON.parse(cookieStore.get("refreshToken")?.value || "{}");

  // ✅ Pass it in
  const wixClient = await wixClientServer(refreshToken);

  const user = await wixClient.members.getCurrentMember({
    fieldsets: [members.Set.FULL],
  });

  if (!user.member?.contactId) {
    return <div>Not logged in!</div>;
  }

  const orderRes = await wixClient.orders.searchOrders({
    search: {
      filter: { "buyerInfo.contactId": { $eq: user.member.contactId } },
    },
  });
console.log(orderRes)
  return (
    <div className="flex flex-col md:flex-row gap-24 md:h-[calc(100vh-180px)] items-center px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
      <div className="w-full md:w-1/2">
        <h1 className="text-2xl">Profile</h1>
        <form action={updateUser} className="mt-12 flex flex-col gap-4">
          <input type="text" hidden name="id" defaultValue={user.member.contactId} />
          <label className="text-sm text-gray-700">Username</label>
          <input
            type="text"
            name="username"
            defaultValue={user.member?.profile?.nickname || ""}
            className="ring-1 ring-gray-300 rounded-md p-2 max-w-96"
          />
          <label className="text-sm text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            defaultValue={user.member?.contact?.firstName || ""}
            className="ring-1 ring-gray-300 rounded-md p-2 max-w-96"
          />
          <label className="text-sm text-gray-700">Surname</label>
          <input
            type="text"
            name="lastName"
            defaultValue={user.member?.contact?.lastName || ""}
            className="ring-1 ring-gray-300 rounded-md p-2 max-w-96"
          />
          <label className="text-sm text-gray-700">Phone</label>
          <input
            type="text"
            name="phone"
            defaultValue={user.member?.contact?.phones?.[0] || ""}
            className="ring-1 ring-gray-300 rounded-md p-2 max-w-96"
          />
          <label className="text-sm text-gray-700">E-mail</label>
          <input
            type="email"
            name="email"
            defaultValue={user.member?.loginEmail || ""}
            className="ring-1 ring-gray-300 rounded-md p-2 max-w-96"
          />
          <button type="submit" className="px-4 py-2 bg-black text-white rounded-md w-fit">
            Update
          </button>
        </form>
      </div>
      <div className="w-full md:w-1/2">
        <h1 className="text-2xl">Orders</h1>
        <div className="mt-12 flex flex-col">
          {orderRes.orders.map((order) => (
            <Link
              href={`/orders/${order._id}`}
              key={order._id}
              className="flex justify-between px-2 py-6 rounded-md hover:bg-green-50 even:bg-slate-100"
            >
              <span className="w-1/4">{order.number?.substring(0, 10)}</span>
              <span className="w-1/4">${order.priceSummary?.subtotal?.amount}</span>
              <span className="w-1/4">{format(order._createdDate)}</span>
              <span className="w-1/4">{order.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
