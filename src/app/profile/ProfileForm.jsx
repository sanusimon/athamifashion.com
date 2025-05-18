// components/ProfileForm.jsx
"use client";

import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/lib/action";

export const ProfileForm = ({ user }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData) => {
    await updateUser(formData);
    startTransition(() => {
      router.refresh(); // Re-fetch the server component
    });
  };

  return (
    <form action={handleSubmit} className="mt-12 flex flex-col gap-4">
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
      <button disabled={isPending} className="px-4 py-2 bg-black text-white rounded-md w-fit">
        {isPending ? "Updating..." : "Update"}
      </button>
    </form>
  );
};
