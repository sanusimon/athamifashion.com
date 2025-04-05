import { Suspense } from 'react';
import NotFoundContent from './NotFoundContent';

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading 404...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
