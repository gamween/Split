import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const buttonIndex = body?.untrustedData?.buttonIndex || 1

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'
    
    // Button 1: I'm a Sender -> /sender
    // Button 2: I'm a Receiver -> /receiver
    const targetPath = buttonIndex === 1 ? '/sender' : '/receiver'
    const targetUrl = `${baseUrl}${targetPath}`

    // Return Frame response with Mini App launch action
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
    <meta property="fc:frame:button:1" content="Launch App" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${targetUrl}" />
  </head>
  <body>
    <p>Redirecting to ${targetPath}...</p>
  </body>
</html>
    `.trim()

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Frame action error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.vercel.app'
  
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
    <meta property="fc:frame:button:1" content="I'm a Sender" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:2" content="I'm a Receiver" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/frame/action" />
  </head>
  <body>
    <h1>BB25 Split</h1>
    <p>Choose your role to get started</p>
  </body>
</html>
  `.trim()

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
