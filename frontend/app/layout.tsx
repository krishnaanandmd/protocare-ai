import './globals.css'

export const metadata = {
  title: 'CareGuide - Personalized Clinical Intelligence',
  description: 'AI-powered clinical decision support with personalized answers based on your surgeon\'s protocols',
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
