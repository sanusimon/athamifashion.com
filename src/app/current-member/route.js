import { wixClientServer } from "@/lib/wixClientServer";
import { cookies } from "next/headers";
import { members } from "@wix/members";

export async function GET() {
  const cookieStore = cookies();
  const refreshToken = JSON.parse(cookieStore.get("refreshToken")?.value || "{}");

  try {
    const wixClient = await wixClientServer(refreshToken);
    const user = await wixClient.members.getCurrentMember({
      fieldsets: [members.Set.FULL],
    });

    const name =
      user?.member?.profile?.nickname ||
      user?.member?.profile?.firstName ||
      user?.member?.profile?.email ||
      "";

    return Response.json({ name });
  } catch (error) {
    console.error("Failed to get current member:", error);
    return Response.json({ name: "" }, { status: 401 });
  }
}
