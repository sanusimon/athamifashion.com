
import { cookies } from "next/headers";
import { wixClientServer } from "@/lib/wixClientServer";
// import { updateUser } from "@/lib/action";
import { members } from "@wix/members";
import Link from "next/link";
import { format } from "timeago.js";
import UpdateButton from "@/Components/UpdateButton";
import { updateUser } from "@/lib/action";
import { ProfileForm } from "./ProfileForm";



const ProfilePage = async () => {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("refreshToken")?.value;

  if (!tokenCookie) {
    return <div className='container text-center'><p>Not logged in!</p></div>;
  }

  let refreshToken;
  try {
    refreshToken = JSON.parse(tokenCookie);
  } catch (err) {
    return <div className='container text-center'><p>Not logged in!</p></div>;
  }

  const wixClient = await wixClientServer(refreshToken);

  let user;

  try {
    user = await wixClient.members.getCurrentMember({
      fieldsets: [members.Set.FULL],
    });
  } catch (err) {
    return  <div className='container text-center'><p>Not logged in!</p></div>;
  }

  if (!user.member?.contactId) {
    return  <div className='container text-center'><p>Not logged in!</p></div>;
  }

  console.log(user.member)
  return (
    <div className="common_page profile_">
      <div className="container">
        <h1 className="text-2xl">Profile</h1>
        <ProfileForm user={user} />
        {/* <form action={updateUser} className="mt-12 flex flex-col gap-4">
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
          <UpdateButton />
        </form> */}
      </div>
    </div>
  );
};

export default ProfilePage;