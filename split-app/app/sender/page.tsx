"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { useConfig } from "wagmi"
import { sendTransaction, waitForTransactionReceipt } from "@wagmi/core"
import { parseEther } from "viem"
import { baseSepolia } from "viem/chains"
import { injected } from "wagmi/connectors"
import { getSplitKey, saveSplitToStorage, loadSplitFromStorage } from "@/lib/utils"
import { SplitConfigurator, type Recipient } from "@/components/SplitConfigurator"
import { toast } from "@/components/ui/use-toast"

const PARTICLE_COUNT = 120
const SPEED = 1.2

function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; baseX: number; baseY: number }>>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        particlesRef.current.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
        })
      }
    }

    const particles = particlesRef.current

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    const handleResize = () => {
      resize()
      particles.forEach((p) => {
        p.baseX = Math.random() * canvas.width
        p.baseY = Math.random() * canvas.height
        p.x = p.baseX
        p.y = p.baseY
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)

    let lastTime = performance.now()
    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16, 2)
      lastTime = currentTime

      ctx.fillStyle = "#fafafa"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const mouseX = mouseRef.current.x
      const mouseY = mouseRef.current.y

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq)

        if (dist < 250 && dist > 0) {
          const force = (250 - dist) / 250
          p.vx += (dx / dist) * force * 0.15 * deltaTime
          p.vy += (dy / dist) * force * 0.15 * deltaTime
        }

        const returnX = p.baseX - p.x
        const returnY = p.baseY - p.y
        p.vx += returnX * 0.002 * deltaTime
        p.vy += returnY * 0.002 * deltaTime

        p.vx *= 0.95
        p.vy *= 0.95

        p.x += p.vx * deltaTime
        p.y += p.vy * deltaTime

        if (p.x < 0) {
          p.x = 0
          p.vx *= -0.5
        }
        if (p.x > canvas.width) {
          p.x = canvas.width
          p.vx *= -0.5
        }
        if (p.y < 0) {
          p.y = 0
          p.vy *= -0.5
        }
        if (p.y > canvas.height) {
          p.y = canvas.height
          p.vy *= -0.5
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(100, 100, 100, 0.25)"
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p2.x - p.x
          const dy2 = p2.y - p.y
          const distSq2 = dx2 * dx2 + dy2 * dy2

          if (distSq2 < 10000) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(100, 100, 100, ${0.08 * (1 - Math.sqrt(distSq2) / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }} />
}

const grayButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#737373",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
  transition: "background-color 0.15s ease",
}

const grayButtonDisabledStyle = {
  ...grayButtonStyle,
  backgroundColor: "#d4d4d4",
  cursor: "not-allowed",
}

export default function SenderPage() {
  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([{ addr: "", bps: 0 }])
  const [amountEth, setAmountEth] = useState<string>("0.01")
  const [splitSaved, setSplitSaved] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors, status: connectStatus } = useConnect()
  const { disconnect } = useDisconnect()
  const config = useConfig()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const isCorrectChain = chainId === baseSepolia.id

  // Disconnect wallet on initial page load only
  useEffect(() => {
    const hasDisconnected = sessionStorage.getItem('sender_disconnected')
    if (isConnected && !hasDisconnected) {
      disconnect()
      sessionStorage.setItem('sender_disconnected', 'true')
    }
  }, [])

  // Load split config from localStorage on wallet connection
  useEffect(() => {
    if (address) {
      const key = getSplitKey(baseSepolia.id, address)
      const savedConfig = loadSplitFromStorage(key)
      if (savedConfig && savedConfig.recipients.length > 0) {
        setSavedRecipients(savedConfig.recipients)
        setSplitSaved(true)
      } else {
        setSplitSaved(false)
      }
    }
  }, [address])

  // Détection du mauvais réseau à la connexion
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      toast({
        title: "Wrong Network",
        description: "Please switch your wallet to Base Sepolia to continue.",
        variant: "destructive",
      })
    }
  }, [isConnected, isCorrectChain])

  function handleSaveSplit(recipients: Recipient[]): void {
    // NO wallet check here - Save split works without wallet connection
    
    // Save split to localStorage only - NO on-chain transaction
    const key = address ? getSplitKey(baseSepolia.id, address) : `split_temp_${Date.now()}`
    const config = {
      recipients: recipients.map(r => ({ addr: r.addr, bps: r.bps })),
      updatedAt: Date.now()
    }
    
    saveSplitToStorage(key, config)
    setSavedRecipients(recipients)
    setSplitSaved(true)
    
    // Success toast is already handled by SplitConfigurator
  }

  function handleClearSplit(): void {
    setSavedRecipients([{ addr: "", bps: 0 }])
    setSplitSaved(false)
    
    // Disconnect wallet
    if (isConnected) {
      disconnect()
    }
    
    // Reset sessionStorage flag
    sessionStorage.removeItem('sender_disconnected')
  }

  async function onSendTip(): Promise<void> {
    try {
      // 1) Check wallet connection first
      if (!isConnected || !address) {
        toast({
          title: "Wallet Required",
          description: "Connect your wallet first.",
          variant: "destructive",
        })
        return
      }
      
      // 2) Vérification de la chaîne
      if (!isCorrectChain) {
        toast({
          title: "Wrong Network",
          description: "Please switch your wallet to Base Sepolia to continue.",
          variant: "destructive",
        })
        if (switchChain) {
          try {
            await switchChain({ chainId: baseSepolia.id })
            toast({
              title: "Switching Network",
              description: "Switching to Base Sepolia...",
            })
            return
          } catch (switchError) {
            toast({
              title: "Network Switch Failed",
              description: "Failed to switch network. Please switch manually to Base Sepolia in your wallet.",
              variant: "destructive",
            })
            return
          }
        }
        return
      }
      
      // 3) Load split config from localStorage
      const key = getSplitKey(baseSepolia.id, address)
      const splitConfig = loadSplitFromStorage(key)
      
      if (!splitConfig || splitConfig.recipients.length === 0) {
        toast({
          title: "Split Required",
          description: "No split configuration found. Please save your split first.",
          variant: "destructive",
        })
        setSplitSaved(false)
        return
      }

      // 4) Verify total BPS = 10000
      const totalBps = splitConfig.recipients.reduce((sum, r) => sum + r.bps, 0)
      if (totalBps !== 10000) {
        toast({
          title: "Invalid Split",
          description: `Total BPS must equal 10000 (current: ${totalBps})`,
          variant: "destructive",
        })
        return
      }
      
      // 5) Validate amount
      if (!amountEth || Number(amountEth) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Enter a valid amount.",
          variant: "destructive",
        })
        return
      }

      setIsSending(true)

      // 6) Convert amount to wei
      const totalWei = parseEther(amountEth)
      const recipients = splitConfig.recipients

      // 7) Calculate shares for each recipient
      const shares: bigint[] = []
      let distributedWei = BigInt(0)

      for (let i = 0; i < recipients.length; i++) {
        if (i === recipients.length - 1) {
          // Last recipient gets the remainder to handle rounding
          shares.push(totalWei - distributedWei)
        } else {
          const shareWei = (totalWei * BigInt(recipients[i].bps)) / BigInt(10000)
          shares.push(shareWei)
          distributedWei += shareWei
        }
      }

      // 8) Send transactions to each recipient
      const txHashes: string[] = []
      
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        const shareWei = shares[i]

        toast({
          title: "Sending...",
          description: `Sending ${i + 1}/${recipients.length} to ${recipient.addr.slice(0, 6)}...${recipient.addr.slice(-4)}`,
        })

        const txHash = await sendTransaction(config, {
          to: recipient.addr as `0x${string}`,
          value: shareWei,
          chainId: baseSepolia.id,
        })

        await waitForTransactionReceipt(config, { 
          hash: txHash, 
          chainId: baseSepolia.id 
        })

        txHashes.push(txHash)
      }

      // 9) Success!
      setIsSending(false)
      toast({
        title: "Success!",
        description: `All ${recipients.length} transactions completed successfully!`,
      })
      
    } catch (e: any) {
      setIsSending(false)
      toast({
        title: "Transaction Failed",
        description: e?.shortMessage || e?.message || "Transaction failed",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <InteractiveBackground />
      <div
        style={{
          minHeight: "100vh",
          padding: "32px 24px 64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "720px", width: "100%" }}>
          <div style={{ marginBottom: "32px" }}>
            <Link
              href="/"
              style={{
                display: "inline-block",
                marginBottom: "12px",
                color: "#737373",
                textDecoration: "none",
                fontSize: "0.8125rem",
                fontWeight: "500",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#404040")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              ← Home
            </Link>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                color: "#171717",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Sender
            </h1>
          </div>

          <SplitConfigurator
            initial={savedRecipients}
            onSave={handleSaveSplit}
            onClear={handleClearSplit}
            className="mb-6"
          />

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              border: "1px solid #e5e5e5",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              position: "relative",
            }}
          >
            {!splitSaved && (
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "#a3a3a3",
                  fontWeight: "600",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginBottom: "16px",
                  padding: "8px",
                  backgroundColor: "#fafafa",
                  borderRadius: "6px",
                }}
              >
                Save split first
              </div>
            )}
            <div style={{ pointerEvents: splitSaved ? "auto" : "none", opacity: splitSaved ? 1 : 0.5 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #f5f5f5",
                  marginBottom: "24px",
                }}
              >
                <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#171717", margin: 0 }}>
                  Send Tip
                </h2>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {isConnected && address ? (
                    <>
                      <span style={{ fontSize: "0.75rem", color: "#737373" }}>
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                      <button
                        onClick={() => disconnect()}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.8125rem",
                          fontWeight: "500",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => connect({ connector: connectors[0] || injected() })}
                      disabled={connectStatus === "pending"}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: connectStatus === "pending" ? "#d4d4d4" : "#262626",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: connectStatus === "pending" ? "not-allowed" : "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (connectStatus !== "pending") e.currentTarget.style.backgroundColor = "#404040"
                      }}
                      onMouseLeave={(e) => {
                        if (connectStatus !== "pending") e.currentTarget.style.backgroundColor = "#262626"
                      }}
                    >
                      {connectStatus === "pending" ? "Connecting..." : "Connect Wallet"}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "0.8125rem",
                    fontWeight: "600",
                    color: "#404040",
                  }}
                >
                  Amount (ETH)
                </label>
                <input
                  id="amount"
                  type="text"
                  placeholder="0.01"
                  value={amountEth}
                  onChange={(e) => setAmountEth(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    border: "1px solid #d4d4d4",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#a3a3a3"
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,120,255,0.08)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d4d4d4"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
              </div>

              <button
                id="btn-send-tip"
                onClick={onSendTip}
                disabled={!isConnected || !splitSaved || !amountEth || Number(amountEth) <= 0 || isSending || !isCorrectChain}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  backgroundColor: (!isConnected || !splitSaved || !amountEth || Number(amountEth) <= 0 || isSending || !isCorrectChain) ? "#d4d4d4" : "#262626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (!isConnected || !splitSaved || !amountEth || Number(amountEth) <= 0 || isSending || !isCorrectChain) ? "not-allowed" : "pointer",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (isConnected && splitSaved && amountEth && Number(amountEth) > 0 && !isSending && isCorrectChain) {
                    e.currentTarget.style.backgroundColor = "#404040"
                  }
                }}
                onMouseLeave={(e) => {
                  if (isConnected && splitSaved && amountEth && Number(amountEth) > 0 && !isSending && isCorrectChain) {
                    e.currentTarget.style.backgroundColor = "#262626"
                  }
                }}
              >
                {isSending ? "Sending..." : !isCorrectChain && isConnected ? "Wrong Network" : "Send Tip"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
