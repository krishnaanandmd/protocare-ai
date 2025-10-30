import './globals.css'

export const metadata = {
  title: 'RAG Assistant',
  description: 'Clinical RAG Q&A System',
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
