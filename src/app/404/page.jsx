// app/404/page.tsx or page.jsx
'use client'; // Required if you're using useSearchParams

import { Suspense } from 'react';
import NotFoundContent from './NotFoundContent';


export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
