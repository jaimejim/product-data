import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Analyzer',
  description: 'Scan product ingredients to check health safety and toxicity ratings',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Analyzer',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-128.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
