import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rilbong Sanatan Hindu Dharma Sabha',
  description: '',
  generator: 'v0.app',
  icons: {
    // This generates a crisp ॐ favicon directly in the browser using an SVG data URI
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="80" fill="%23d9711b" font-family="serif">ॐ</text></svg>',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf3e6' },
    { media: '(prefers-color-scheme: dark)', color: '#4a1210' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}