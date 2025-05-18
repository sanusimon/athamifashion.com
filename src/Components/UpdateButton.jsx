"use client";

import { useFormStatus } from "react-dom";

const UpdateButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="px-4 py-2 bg-black text-white rounded-md w-fit"
    >
      {pending ? "Updating..." : "Update"}
    </button>
  );
};

export default UpdateButton;