import './globals.css'

export const metadata = {
  title: 'GameBit - 1 Sentence to a Game',
  description: '8-bit style game generator from sentences',
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
