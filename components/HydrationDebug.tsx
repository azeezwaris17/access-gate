"use client";

import { useEffect } from 'react';

export function HydrationDebug() {
  useEffect(() => {
    console.log('Hydration completed');
  }, []);

  return null;
}