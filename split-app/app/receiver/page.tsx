"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi"
import ForwarderFactoryABI from "@/src/abi/ForwarderFactory.json"
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

export default function ReceiverPage() {
  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([{ addr: "", bps: 0 }])
  const [forwarder, setForwarder] = useState<string>("")
  const [paylink, setPaylink] = useState<string>("")
  const [step1Done, setStep1Done] = useState<boolean>(false)

  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`
  
  // Generate a deterministic owner address from the split configuration
  const derivedOwner = savedRecipients.length > 0 && savedRecipients[0].addr 
    ? savedRecipients[0].addr 
    : "0x0000000000000000000000000000000000000001"

  const { writeContract, data: hash, isPending: isDeploying } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const { data: computedForwarder } = useReadContract({
    address: factoryAddress,
    abi: ForwarderFactoryABI,
    functionName: "forwarderAddress",
    args: [derivedOwner as `0x${string}`],
  })

  useEffect(() => {
    if (isConfirmed && computedForwarder) {
      const fwdAddress = computedForwarder as string
      setForwarder(fwdAddress)
      setPaylink(`ethereum:${fwdAddress}`)
      toast({
        title: "Success",
        description: "Unique address created",
      })
    }
  }, [isConfirmed, computedForwarder])

  function handleSaveSplit(recipients: Recipient[]): void {
    // Save to localStorage only - NO on-chain transaction
    // Use first recipient address as key identifier
    const keyIdentifier = recipients.length > 0 && recipients[0].addr 
      ? recipients[0].addr 
      : `temp_${Date.now()}`
    
    const key = getSplitKey(84532, keyIdentifier) // Base Sepolia chainId
    const config = {
      recipients: recipients.map(r => ({ addr: r.addr, bps: r.bps })),
      updatedAt: Date.now()
    }
    
    saveSplitToStorage(key, config)
    setSavedRecipients(recipients)
    setStep1Done(true)
  }

  function onGetForwarder(): void {
    if (!step1Done) {
      toast({
        title: "Split Required",
        description: "Please save split first",
        variant: "destructive",
      })
      return
    }
    
    writeContract({
      address: factoryAddress,
      abi: ForwarderFactoryABI,
      functionName: "getOrDeploy",
      args: [derivedOwner as `0x${string}`],
    })
  }

  function onCopyAddress(): void {
    if (!forwarder) return
    navigator.clipboard.writeText(forwarder).then(
      () => toast({ title: "Success", description: "Address copied" }),
      () => toast({ title: "Error", description: "Failed to copy address", variant: "destructive" })
    )
  }

  function onCopyPaymentLink(): void {
    if (!paylink) return
    navigator.clipboard.writeText(paylink).then(
      () => toast({ title: "Success", description: "Payment link copied" }),
      () => toast({ title: "Error", description: "Failed to copy link", variant: "destructive" })
    )
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
              Receiver
            </h1>
          </div>

          <SplitConfigurator
            initial={savedRecipients}
            onSave={handleSaveSplit}
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
            <div style={{ pointerEvents: step1Done ? "auto" : "none", opacity: step1Done ? 1 : 0.5 }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #f5f5f5",
                  color: "#171717",
                  margin: 0,
                  marginBottom: "24px",
                }}
              >
                Your payment target
              </h2>

              <div style={{ marginBottom: "24px" }}>
                <button
                  id="btn-get-forwarder"
                  onClick={onGetForwarder}
                  disabled={isDeploying || isConfirming || !step1Done}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1.25rem",
                    backgroundColor: (isDeploying || isConfirming || !step1Done) ? "#d4d4d4" : "#262626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: (isDeploying || isConfirming || !step1Done) ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeploying && !isConfirming && step1Done) {
                      e.currentTarget.style.backgroundColor = "#404040"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDeploying && !isConfirming && step1Done) {
                      e.currentTarget.style.backgroundColor = "#262626"
                    }
                  }}
                >
                  {isDeploying || isConfirming ? "Creating..." : "Get unique address"}
                </button>
              </div>

              {forwarder && (
                <>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: "600",
                        color: "#404040",
                      }}
                    >
                      Unique address
                    </label>
                    <input
                      id="forwarder"
                      type="text"
                      value={forwarder}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        border: "1px solid #d4d4d4",
                        borderRadius: "6px",
                        fontSize: "0.875rem",
                        backgroundColor: "#f9fafb",
                        color: "#525252",
                        marginBottom: "12px",
                      }}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        id="btn-copy-address"
                        onClick={onCopyAddress}
                        disabled={!forwarder}
                        style={
                          !forwarder
                            ? grayButtonDisabledStyle
                            : grayButtonStyle
                        }
                        onMouseEnter={(e) => {
                          if (forwarder) e.currentTarget.style.backgroundColor = "#525252"
                        }}
                        onMouseLeave={(e) => {
                          if (forwarder) e.currentTarget.style.backgroundColor = "#737373"
                        }}
                      >
                        Copy address
                      </button>
                      <button
                        id="btn-copy-payment-link"
                        onClick={onCopyPaymentLink}
                        disabled={!paylink}
                        style={
                          !paylink
                            ? grayButtonDisabledStyle
                            : grayButtonStyle
                        }
                        onMouseEnter={(e) => {
                          if (paylink) e.currentTarget.style.backgroundColor = "#525252"
                        }}
                        onMouseLeave={(e) => {
                          if (paylink) e.currentTarget.style.backgroundColor = "#737373"
                        }}
                      >
                        Copy payment link
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
