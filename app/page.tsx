'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to signin page
    router.push('/signin');
  }, [router]);

  return null;
}