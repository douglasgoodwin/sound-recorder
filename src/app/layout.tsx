

import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Soundwalk Recorder',
  description: 'Record and organize soundmarks, keynotes, and sound pointers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-100 p-4 mb-4">
          <div className="max-w-4xl mx-auto flex gap-4">
          	<div className="font-semibold">Songlines and Linked Lists</div>
            <Link href="/" className="hover:text-blue-600">
              Record
            </Link>
            <Link href="/recordings" className="hover:text-blue-600">
              All Recordings
            </Link>
            <Link href="/soundwalk" className="hover:text-blue-600">
              Soundwalk
            </Link>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  )
}