'use client';

import { useSearchParams } from 'next/navigation';

export default function NotFoundContent() {
  const searchParams = useSearchParams();

  // Example: grab a search param (optional)
  const error = searchParams.get('error');

  return (
    <div>
      <h1>Page not found</h1>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
