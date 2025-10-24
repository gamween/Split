import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Providers from './providers'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'BB25 Split - Decentralized Tip Splitting',
  description: 'Split tips instantly on Base Sepolia. Configure recipients and distribute ETH automatically.',
  openGraph: {
    title: 'BB25 Split - Decentralized Tip Splitting',
    description: 'Split tips instantly on Base Sepolia. Configure recipients and distribute ETH automatically.',
    images: ['/og.svg'],
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://your-domain.vercel.app/embed-image.svg',
      button: {
        title: 'Launch BB25 Split',
        action: {
          type: 'launch_miniapp',
          name: 'BB25 Split',
          url: 'https://your-domain.vercel.app'
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
