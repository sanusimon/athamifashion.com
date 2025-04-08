"use server";

import { wixClientServer } from "./wixClientServer";

export const updateUser = async (formData) => {
  const wixClient = await wixClientServer();

  const id = formData.get("id");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const username = formData.get("username");

  await wixClient.contacts.updateContact(id, {
    firstName,
    lastName,
    phones: [phone],
    emails: [email],
  });

  await wixClient.members.updateMember(id, {
    profile: {
      nickname: username,
    },
  });
};
