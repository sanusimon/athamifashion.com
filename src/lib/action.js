"use server";

import { cookies } from "next/headers";
import { wixClientServer } from "./wixClientServer";
// import { redirect } from "next/navigation";

export const updateUser = async (formData) => {
  const cookieStore = await cookies(); // <-- await here
  const tokenCookie = cookieStore.get("refreshToken")?.value;

  if (!tokenCookie) return;

  let refreshToken;
  try {
    refreshToken = JSON.parse(tokenCookie);
  } catch (err) {
    return;
  }

  const wixClient = await wixClientServer(refreshToken);

  const id = formData.get("id");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const username = formData.get("username");

  try {
    await wixClient.members.updateMember(id, {
      contact: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phones: phone ? [phone] : undefined,
      },
      loginEmail: email || undefined,
      profile: { nickname: username || undefined },
    });

    // redirect("/profile");
  } catch (err) {
    if (err?.digest === "NEXT_REDIRECT") {
      // ignore redirect error here
      return;
    }
    console.error("Update failed in caller:", err);
  }
  
}