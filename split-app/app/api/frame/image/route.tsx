import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          padding: '40px',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '4px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#ffffff',
            }}
          >
            BB
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '20px',
          }}
        >
          BB25 Split
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#a3a3a3',
            marginBottom: '40px',
          }}
        >
          Decentralized Tip Splitting on Base Sepolia
        </div>

        {/* Call to action */}
        <div
          style={{
            fontSize: '24px',
            color: '#d4d4d4',
          }}
        >
          Choose your role to get started
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
