import './globals.css'

export const metadata = {
  title: 'Commentr - AI Growth Engine for Startups',
  description: 'The AI that learns your startup—then grows it for you through authentic posts and replies.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}