import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Log webhook events for debugging
    console.log('Webhook received:', {
      timestamp: new Date().toISOString(),
      body
    })

    // Here you can handle different webhook events from Farcaster
    // For now, we just acknowledge receipt
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook received' 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Invalid webhook payload' },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'BB25 Split webhook endpoint',
    status: 'active'
  })
}
