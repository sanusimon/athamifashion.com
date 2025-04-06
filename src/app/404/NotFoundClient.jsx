"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const params = useSearchParams();
  const from = params.get("from");

  return (
    <div className="not-found">
      <h1>Oops! Page not found</h1>
      {from && <p>You were redirected here from: {from}</p>}
    </div>
  );
}
