'use client';

import { useSearchParams } from 'next/navigation';

export default function NotFoundContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="text-center p-10">
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
