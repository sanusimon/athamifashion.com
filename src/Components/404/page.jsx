import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading 404...</div>}>
      <NotFoundClient />
    </Suspense>
  );
}
