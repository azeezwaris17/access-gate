// app/docs/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

export default function ApiDocs() {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading API Documentation...</p>
          </div>
        </div>
      )}
      
      {/* Only render iframe on client side to avoid hydration mismatch */}
      {isClient && (
        <iframe
          src="/swagger.html"
          className="w-full h-screen border-0"
          onLoad={() => setIsLoading(false)}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      )}
    </div>
  );
}