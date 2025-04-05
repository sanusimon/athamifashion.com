// src/app/404/page.tsx or wherever your 404 page is

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SearchParamsSection() {
  const params = useSearchParams()
  // Your logic here
  return <p>Something based on params: {params.get('foo')}</p>
}

export default function NotFoundPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      
      {/* ✅ Wrap this in Suspense */}
      <Suspense fallback={<p>Loading search info...</p>}>
        <SearchParamsSection />
      </Suspense>
    </div>
  )
}
