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
  console.log(user)


  if (!user.member?.contactId) {
    return <div>Not logged in!</div>;
  }

  const orderRes = await wixClient.orders.searchOrders({
    search: {
      filter: { "buyerInfo.contactId": { $eq: user.member.contactId } },
    },
  });

  return (
    <div className="common_page profile_">
      <div className="container">
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
    </div>
  );
};

export default ProfilePage;
