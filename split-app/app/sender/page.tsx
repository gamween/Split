"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConnect, useDisconnect } from "wagmi"
import { parseEther } from "viem"
import { injected } from "wagmi/connectors"
import TipSplitterABIJson from "@/src/abi/TipSplitter.json"

const TipSplitterABI = TipSplitterABIJson as any

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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        backgroundColor: "#262626",
        color: "#fafafa",
        padding: "0.875rem 1.25rem",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        zIndex: 1000,
        fontSize: "0.875rem",
        fontWeight: "500",
      }}
    >
      {message}
    </div>
  )
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
  const [rows, setRows] = useState<{ addr: string; bps: string }[]>([{ addr: "", bps: "" }])
  const [amount, setAmount] = useState<string>("0.01")
  const [toast, setToast] = useState<string>("")
  const [step1Done, setStep1Done] = useState<boolean>(false)

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT as `0x${string}`

  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const { 
    writeContract, 
    data: setSplitHash, 
    isPending: isSetSplitPending,
    error: setSplitError 
  } = useWriteContract()

  const { 
    writeContract: sendTipWrite, 
    data: sendTipHash, 
    isPending: isSendTipPending,
    error: sendTipError 
  } = useWriteContract()

  const { isLoading: isSetSplitConfirming, isSuccess: isSetSplitConfirmed } = useWaitForTransactionReceipt({ 
    hash: setSplitHash 
  })

  const { isLoading: isSendTipConfirming, isSuccess: isSendTipConfirmed } = useWaitForTransactionReceipt({ 
    hash: sendTipHash 
  })

  useEffect(() => {
    if (isSetSplitConfirmed && setSplitHash) {
      setStep1Done(true)
      setToast(`✅ Split saved on-chain! Tx: ${setSplitHash.slice(0, 10)}...${setSplitHash.slice(-8)}`)
    }
  }, [isSetSplitConfirmed, setSplitHash])

  useEffect(() => {
    if (isSendTipConfirmed && sendTipHash) {
      setToast(`✅ Tip sent successfully! Tx: ${sendTipHash.slice(0, 10)}...${sendTipHash.slice(-8)}`)
    }
  }, [isSendTipConfirmed, sendTipHash])

  useEffect(() => {
    if (setSplitError) {
      setToast(`❌ Error: ${setSplitError.message}`)
    }
  }, [setSplitError])

  useEffect(() => {
    if (sendTipError) {
      setToast(`❌ Error: ${sendTipError.message}`)
    }
  }, [sendTipError])

  function addRow(): void {
    setRows([...rows, { addr: "", bps: "" }])
  }

  function removeRow(): void {
    if (rows.length === 1) return
    setRows(rows.slice(0, -1))
  }

  function onEvenSplit(): void {
    const bpsPerRow = Math.floor(10000 / rows.length)
    const remainder = 10000 - bpsPerRow * rows.length
    setRows(
      rows.map((row, i) => ({
        ...row,
        bps: (i === 0 ? bpsPerRow + remainder : bpsPerRow).toString(),
      })),
    )
  }

  function onSetSplit(): void {
    const totalBps = rows.reduce((sum, row) => sum + (parseInt(row.bps) || 0), 0)
    if (totalBps !== 10000) {
      setToast("Total BPS must equal 10000")
      return
    }

    const recipients = rows.map(row => ({
      addr: row.addr as `0x${string}`,
      shareBps: parseInt(row.bps)
    }))

    writeContract({
      address: contractAddress,
      abi: TipSplitterABI,
      functionName: "setSplit",
      args: [recipients],
    })
  }

  function onSendTip(): void {
    if (!isConnected) {
      setToast("Please connect your wallet first")
      return
    }

    if (!address) {
      setToast("Wallet address not available")
      return
    }

    if (!amount || amount.trim() === "" || Number(amount) <= 0) {
      setToast("Please enter a valid amount")
      return
    }

    try {
      const value = parseEther(amount)
      
      sendTipWrite({
        address: contractAddress,
        abi: TipSplitterABI,
        functionName: "depositFor",
        args: [address as `0x${string}`],
        value: value,
      })
    } catch (error) {
      setToast("Invalid amount format")
    }
  }

  return (
    <>
      <InteractiveBackground />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
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

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "28px",
              marginBottom: "24px",
              border: "1px solid #e5e5e5",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <h2 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#171717", margin: 0 }}>
                Configure my split
              </h2>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  id="btn-even-split"
                  onClick={onEvenSplit}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#262626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
                >
                  Even Split
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              {rows.map((row, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    id={`addr-${index}`}
                    type="text"
                    placeholder="0x..."
                    value={row.addr}
                    onChange={(e) => {
                      const newRows = [...rows]
                      newRows[index].addr = e.target.value
                      setRows(newRows)
                    }}
                    style={{
                      flex: "2",
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
                  <input
                    id={`bps-${index}`}
                    type="text"
                    placeholder="bps"
                    value={row.bps}
                    onChange={(e) => {
                      const newRows = [...rows]
                      newRows[index].bps = e.target.value
                      setRows(newRows)
                    }}
                    style={{
                      flex: "1",
                      minWidth: "100px",
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
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <button
                id="btn-add-row"
                onClick={addRow}
                style={grayButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#525252")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#737373")}
              >
                Add Row
              </button>
              <button
                id="btn-remove-row"
                onClick={removeRow}
                disabled={rows.length === 1}
                style={rows.length === 1 ? grayButtonDisabledStyle : grayButtonStyle}
                onMouseEnter={(e) => {
                  if (rows.length > 1) e.currentTarget.style.backgroundColor = "#525252"
                }}
                onMouseLeave={(e) => {
                  if (rows.length > 1) e.currentTarget.style.backgroundColor = "#737373"
                }}
              >
                Remove Row
              </button>
            </div>

            <button
              id="btn-set-split"
              onClick={onSetSplit}
              disabled={isSetSplitPending || isSetSplitConfirming}
              style={{
                width: "100%",
                padding: "0.875rem",
                backgroundColor: (isSetSplitPending || isSetSplitConfirming) ? "#d4d4d4" : "#262626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: (isSetSplitPending || isSetSplitConfirming) ? "not-allowed" : "pointer",
                fontSize: "0.9375rem",
                fontWeight: "600",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSetSplitPending && !isSetSplitConfirming) {
                  e.currentTarget.style.backgroundColor = "#404040"
                }
              }}
              onMouseLeave={(e) => {
                if (!isSetSplitPending && !isSetSplitConfirming) {
                  e.currentTarget.style.backgroundColor = "#262626"
                }
              }}
            >
              {isSetSplitPending || isSetSplitConfirming ? "Setting Split..." : "Set Split"}
            </button>
          </div>

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
            {!step1Done && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  fontSize: "0.6875rem",
                  color: "#a3a3a3",
                  fontWeight: "600",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                Step 1 required
              </div>
            )}
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
                Send Tip
              </h2>

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
                  Wallet
                </label>
                {isConnected && address ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 0.875rem",
                      border: "1px solid #d4d4d4",
                      borderRadius: "6px",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: "#404040" }}>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <button
                      onClick={() => disconnect()}
                      style={{
                        padding: "0.375rem 0.75rem",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ef4444")}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connect({ connector: injected() })}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem",
                      backgroundColor: "#262626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
                  >
                    Connect Wallet
                  </button>
                )}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                disabled={isSendTipPending || isSendTipConfirming || !isConnected}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  backgroundColor: (isSendTipPending || isSendTipConfirming || !isConnected) ? "#d4d4d4" : "#262626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (isSendTipPending || isSendTipConfirming || !isConnected) ? "not-allowed" : "pointer",
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSendTipPending && !isSendTipConfirming && isConnected) {
                    e.currentTarget.style.backgroundColor = "#404040"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSendTipPending && !isSendTipConfirming && isConnected) {
                    e.currentTarget.style.backgroundColor = "#262626"
                  }
                }}
              >
                {isSendTipPending || isSendTipConfirming ? "Sending Tip..." : !isConnected ? "Connect Wallet First" : "Send Tip"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
