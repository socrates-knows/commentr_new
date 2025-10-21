'use client'

import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}