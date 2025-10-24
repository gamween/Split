"use client"

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Wait for app to be fully loaded
        if (typeof window !== 'undefined') {
          // Signal that the app is ready to be displayed
          await sdk.actions.ready()
          setIsReady(true)
          console.log('Mini App SDK initialized and ready')
        }
      } catch (error) {
        console.error('Failed to initialize Mini App SDK:', error)
        // Still show the app even if SDK fails (for non-mini-app contexts)
        setIsReady(true)
      }
    }

    initMiniApp()
  }, [])

  // Show loading splash while initializing
  if (!isReady) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '3px solid #ffffff',
          borderRadius: '50%',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>
          Loading BB25 Split...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
