import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strava Training Dashboard',
  description: 'Visualize your training and get a free AI-powered race plan.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
