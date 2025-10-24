import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'

export const metadata: Metadata = {
  title: 'BB25 Split - Decentralized Tip Splitting',
  description: 'Split tips instantly on Base Sepolia. Configure recipients and distribute ETH automatically.',
  openGraph: {
    title: 'BB25 Split',
    description: 'Decentralized Tip Splitting on Base Sepolia',
    images: [`${baseUrl}/api/frame/image`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${baseUrl}/api/frame/image`,
    'fc:frame:button:1': 'I\'m a Sender',
    'fc:frame:button:1:action': 'post',
    'fc:frame:button:2': 'I\'m a Receiver',
    'fc:frame:button:2:action': 'post',
    'fc:frame:post_url': `${baseUrl}/api/frame/action`,
  },
}

export { default } from './page'
