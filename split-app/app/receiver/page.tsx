"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useReadContract, usePublicClient } from "wagmi"
import { useConfig } from "wagmi"
import { writeContract, waitForTransactionReceipt } from "@wagmi/core"
import { base } from "viem/chains"
import { injected } from "wagmi/connectors"
import ForwarderFactoryABI from "@/src/abi/ForwarderFactory.json"
import TipSplitterABI from "@/src/abi/TipSplitter.json"
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
  const [step1Done, setStep1Done] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [isDeploying, setIsDeploying] = useState<boolean>(false)
  const [forwarderDeployed, setForwarderDeployed] = useState<boolean>(false)
  const [showTooltip, setShowTooltip] = useState<boolean>(false)
  const [splitSaved, setSplitSaved] = useState<boolean>(false)

  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`
  const tipSplitterAddress = process.env.NEXT_PUBLIC_TIP_SPLITTER as `0x${string}`
  
  const { address, isConnected } = useAccount()
  const { connect, connectors, status: connectStatus } = useConnect()
  const { disconnect } = useDisconnect()
  const config = useConfig()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: base.id })

  const isCorrectChain = chainId === base.id

  // Disconnect wallet on initial page load only
  useEffect(() => {
    const hasDisconnected = sessionStorage.getItem('receiver_disconnected')
    if (isConnected && !hasDisconnected) {
      disconnect()
      sessionStorage.setItem('receiver_disconnected', 'true')
    }
  }, [])
  
  // Use the first recipient address as the owner - only if split is saved
  const ownerAddress = splitSaved && savedRecipients.length > 0 && savedRecipients[0].addr 
    ? savedRecipients[0].addr 
    : null

  const { data: computedForwarder } = useReadContract({
    address: factoryAddress,
    abi: ForwarderFactoryABI,
    functionName: "forwarderAddress",
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress && splitSaved, // Only query if split is saved
    }
  })

  // Check if split is already registered on-chain
  const { data: splitLength } = useReadContract({
    address: tipSplitterAddress,
    abi: TipSplitterABI,
    functionName: "getSplitLength",
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress && splitSaved, // Only query if split is saved
    }
  })

  useEffect(() => {
    // Check if split is already registered (length > 0)
    if (splitLength && Number(splitLength) > 0 && !step1Done) {
      setStep1Done(true)
    }
  }, [splitLength, step1Done])

  useEffect(() => {
    // Check if forwarder is deployed by trying to read its bytecode
    async function checkForwarderDeployment() {
      if (!computedForwarder || !publicClient) return
      
      try {
        const code = await publicClient.getBytecode({ address: computedForwarder as `0x${string}` })
        
        if (code && code !== "0x" && !forwarderDeployed) {
          setForwarderDeployed(true)
        }
      } catch (error) {
        // Forwarder not deployed yet
      }
    }
    
    checkForwarderDeployment()
  }, [computedForwarder, publicClient, forwarderDeployed])

  useEffect(() => {
    // Automatically display the computed forwarder address when split is saved and registered
    if (step1Done && computedForwarder) {
      const fwdAddress = computedForwarder as string
      setForwarder(fwdAddress)
    }
  }, [step1Done, computedForwarder])

  async function handleSaveSplit(recipients: Recipient[]): Promise<void> {
    // Save to localStorage
    const firstRecipient = recipients[0]?.addr || `temp_${Date.now()}`
    const key = getSplitKey(8453, firstRecipient) // Base Mainnet chainId
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
    setForwarder("")
    setStep1Done(false)
    setForwarderDeployed(false)
    
    // Disconnect wallet
    if (isConnected) {
      disconnect()
    }
    
    // Reset sessionStorage flag
    sessionStorage.removeItem('receiver_disconnected')
  }

  async function handleRegisterSplit(): Promise<void> {
    try {
      // 1) Check wallet connection
      if (!isConnected || !address) {
        toast({
          title: "Wallet Required",
          description: "Connect your wallet first.",
          variant: "destructive",
        })
        return
      }

      // 2) Check correct chain
      if (!isCorrectChain) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Base Sepolia.",
          variant: "destructive",
        })
        if (switchChain) {
          try {
            await switchChain({ chainId: base.id })
            return
          } catch (switchError) {
            return
          }
        }
        return
      }

      // 3) IMPORTANT: Check if connected wallet is the OWNER (first recipient)
      // This is required because the split must be registered under the owner's address
      const firstRecipient = savedRecipients[0]?.addr
      if (!firstRecipient || address.toLowerCase() !== firstRecipient.toLowerCase()) {
        toast({
          title: "Wrong Wallet",
          description: `You must connect with the first recipient's wallet (${firstRecipient?.slice(0, 6)}...${firstRecipient?.slice(-4)}) to register this split.`,
          variant: "destructive",
        })
        return
      }

      setIsRegistering(true)

      // 4) Prepare recipients for contract
      const contractRecipients = savedRecipients.map(r => ({
        addr: r.addr as `0x${string}`,
        shareBps: BigInt(r.bps),
      }))

      // 5) Call setSplit on TipSplitter
      toast({
        title: "Registering Split",
        description: "Please confirm the transaction in your wallet...",
      })

      const txHash = await writeContract(config, {
        address: tipSplitterAddress,
        abi: TipSplitterABI,
        functionName: "setSplit",
        args: [contractRecipients],
        chainId: base.id,
      })

      toast({
        title: "Waiting for Confirmation",
        description: "Transaction submitted, waiting for confirmation...",
      })

      await waitForTransactionReceipt(config, { 
        hash: txHash, 
        chainId: base.id 
      })

      setStep1Done(true)
      setIsRegistering(false)

      toast({
        title: "Success!",
        description: "Split registered on-chain. Your payment address is ready!",
      })

    } catch (e: any) {
      setIsRegistering(false)
      toast({
        title: "Registration Failed",
        description: e?.shortMessage || e?.message || "Failed to register split",
        variant: "destructive",
      })
    }
  }

  async function handleDeployForwarder(): Promise<void> {
    if (!isConnected || !address) {
      toast({ 
        title: "Wallet Not Connected", 
        description: "Please connect your wallet first.", 
        variant: "destructive" 
      })
      return
    }

    if (!isCorrectChain) {
      toast({ 
        title: "Wrong Network", 
        description: "Please switch to Base Sepolia.", 
        variant: "destructive" 
      })
      return
    }

    try {
      setIsDeploying(true)

      const ownerAddr = savedRecipients[0].addr as `0x${string}`

      toast({
        title: "Deploying Forwarder",
        description: "Please confirm the transaction in your wallet...",
      })

      const txHash = await writeContract(config, {
        address: factoryAddress,
        abi: ForwarderFactoryABI,
        functionName: "deploy",
        args: [ownerAddr],
        chainId: base.id,
      })

      toast({
        title: "Waiting for Confirmation",
        description: "Transaction submitted, waiting for confirmation...",
      })

      await waitForTransactionReceipt(config, { 
        hash: txHash, 
        chainId: base.id 
      })

      setForwarderDeployed(true)
      setIsDeploying(false)

      toast({
        title: "Success!",
        description: "Forwarder deployed! You can now receive payments.",
      })

    } catch (e: any) {
      setIsDeploying(false)
      toast({
        title: "Deployment Failed",
        description: e?.shortMessage || e?.message || "Failed to deploy forwarder",
        variant: "destructive",
      })
    }
  }

  function onCopyAddress(): void {
    if (!forwarder) return
    navigator.clipboard.writeText(forwarder).then(
      () => toast({ title: "Success", description: "Address copied" }),
      () => toast({ title: "Error", description: "Failed to copy address", variant: "destructive" })
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
              Receiver (beta)
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
                Register Split & Get Address
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

            {!step1Done ? (
              <>
                {savedRecipients[0]?.addr && (
                  <div style={{ 
                    padding: "12px 16px",
                    backgroundColor: "#fef3c7",
                    border: "1px solid #fbbf24",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "0.8125rem",
                    color: "#92400e",
                    lineHeight: "1.5"
                  }}>
                    <strong>Important:</strong> The first recipient ({savedRecipients[0].addr.slice(0, 6)}...{savedRecipients[0].addr.slice(-4)}) must connect their wallet to register the split on-chain.
                  </div>
                )}
                
                <div style={{ marginBottom: "20px" }}>
                  <button
                    onClick={handleRegisterSplit}
                    disabled={!isConnected || isRegistering || !isCorrectChain || step1Done}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      backgroundColor: (!isConnected || isRegistering || !isCorrectChain || step1Done) ? "#d4d4d4" : "#262626",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: (!isConnected || isRegistering || !isCorrectChain || step1Done) ? "not-allowed" : "pointer",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isConnected && !isRegistering && isCorrectChain && !step1Done) {
                        e.currentTarget.style.backgroundColor = "#404040"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isConnected && !isRegistering && isCorrectChain && !step1Done) {
                        e.currentTarget.style.backgroundColor = "#262626"
                      }
                    }}
                  >
                    {step1Done ? "✓ Split Registered" : isRegistering ? "Registering..." : !isCorrectChain && isConnected ? "Wrong Network" : "1. Register Split On-Chain"}
                  </button>
                </div>

                {step1Done && !forwarderDeployed && (
                  <div style={{ marginBottom: "20px" }}>
                    <button
                      onClick={handleDeployForwarder}
                      disabled={isDeploying || !isCorrectChain}
                      style={{
                        width: "100%",
                        padding: "0.875rem",
                        backgroundColor: (isDeploying || !isCorrectChain) ? "#d4d4d4" : "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: (isDeploying || !isCorrectChain) ? "not-allowed" : "pointer",
                        fontSize: "0.9375rem",
                        fontWeight: "600",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeploying && isCorrectChain) {
                          e.currentTarget.style.backgroundColor = "#047857"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeploying && isCorrectChain) {
                          e.currentTarget.style.backgroundColor = "#059669"
                        }
                      }}
                    >
                      {isDeploying ? "Deploying Forwarder..." : "2. Deploy Forwarder Contract"}
                    </button>
                  </div>
                )}

                {forwarderDeployed && (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#dcfce7",
                    border: "1px solid #86efac",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "0.8125rem",
                    color: "#166534",
                    lineHeight: "1.5"
                  }}>
                    ✓ Forwarder deployed! Payments sent to your address will now be automatically distributed to all recipients.
                  </div>
                )}

                <div style={{ textAlign: "center", position: "relative", marginTop: "16px" }}>
                  <span 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    style={{ 
                      fontSize: "0.8125rem", 
                      color: "#737373",
                      cursor: "default",
                      borderBottom: "1px dotted #737373",
                      position: "relative"
                    }}
                  >
                    Why are you paying fees?
                  </span>
                  
                  {showTooltip && (
                    <div style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginBottom: "8px",
                      padding: "12px 16px",
                      backgroundColor: "#262626",
                      color: "white",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      lineHeight: "1.5",
                      maxWidth: "320px",
                      width: "max-content",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                      textAlign: "left"
                    }}>
                      <strong>Step 1:</strong> Register your split configuration on the TipSplitter contract.<br/><br/>
                      <strong>Step 2:</strong> Deploy the Forwarder contract that will automatically redistribute payments to all recipients. Without this step, funds sent to the address will just sit there.<br/><br/>
                      Both steps require a small gas fee (usually a few cents) that must be paid by the first address in the split.
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid #262626"
                      }} />
                    </div>
                  )}
                </div>
              </>
            ) : (
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
                    Unique payment address
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
