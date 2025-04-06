export const dynamic = "force-dynamic"; // Ensures this page is never statically generated

import dynamic from "next/dynamic";

// ✅ Dynamically import the client component with SSR disabled
const NotFoundClient = dynamic(() => import("./NotFoundClient"), {
  ssr: false,
  loading: () => <div>Loading 404...</div>,
});

export default function NotFoundPage() {
  return <NotFoundClient />;
}
