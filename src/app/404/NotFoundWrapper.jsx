"use client";

import dynamic from "next/dynamic";

const NotFoundClient = dynamic(() => import("./NotFoundClient"), {
  ssr: false,
  loading: () => <div>Loading 404...</div>,
});

export default function NotFoundWrapper() {
  return <NotFoundClient />;
}
