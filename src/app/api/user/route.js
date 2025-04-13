// app/api/user/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { wixClientServer } from "@/lib/wixClientServer";
import { members } from "@wix/members";

export async function GET() {
  const cookieStore = cookies();
  const refreshToken = JSON.parse(cookieStore.get("refreshToken")?.value || "{}");

  const wixClient = await wixClientServer(refreshToken);
  const user = await wixClient.members.getCurrentMember({
    fieldsets: [members.Set.FULL],
  });

  if (!user.member?.contactId) {
    return NextResponse.json({ nickname: null }, { status: 401 });
  }

  return NextResponse.json({ nickname: user.member?.profile?.nickname });
}
