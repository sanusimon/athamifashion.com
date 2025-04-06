export const dynamic = "force-dynamic";
export const dynamicParams = true;

import dynamic from "next/dynamic";

const NotFoundClient = dynamic(() => import("./NotFoundClient"), {
  ssr: false, // 🚨 This disables server-side rendering for this component
  loading: () => <div>Loading 404...</div>,
});

export default function NotFoundPage() {
  return <NotFoundClient />;
}
