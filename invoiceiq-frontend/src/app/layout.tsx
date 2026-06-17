import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })
// Inter = Google Font, clean modern font

export const metadata: Metadata = {
  title: 'InvoiceIQ — Smart Invoice Processing',
  description: 'Multi-tenant OCR Invoice SaaS',
}

// RootLayout = எல்லா pages-க்கும் common wrapper
// இங்கே Providers வைக்கிறோம் — அதனால எல்லா pages-லயும் auth + cache வேலை செய்யும்
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}