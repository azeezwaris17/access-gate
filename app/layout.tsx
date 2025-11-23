import React from 'react'; 
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '../providers';
import { HydrationDebug } from '../components/HydrationDebug';

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist',
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'AccessGate - Event Ticketing System',
  description: 'Secure event ticketing and access control',
  icons: {
    icon: '/access-gate-favicon-2.png', 
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <HydrationDebug />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}