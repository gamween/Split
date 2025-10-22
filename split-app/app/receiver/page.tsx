"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

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

export default function ReceiverPage() {
  const [rowsRecv, setRowsRecv] = useState<{ addr: string; bps: string }[]>([{ addr: "", bps: "" }])
  const [forwarder, setForwarder] = useState<string>("")
  const [paylink, setPaylink] = useState<string>("")
  const [toast, setToast] = useState<string>("")
  const [step1Done, setStep1Done] = useState<boolean>(false)

  function addRowRecv(): void {
    setRowsRecv([...rowsRecv, { addr: "", bps: "" }])
  }

  function removeRowRecv(): void {
    if (rowsRecv.length === 1) return
    setRowsRecv(rowsRecv.slice(0, -1))
  }

  function onEvenSplitRecv(): void {
    const bpsPerRow = Math.floor(10000 / rowsRecv.length)
    const remainder = 10000 - bpsPerRow * rowsRecv.length
    setRowsRecv(
      rowsRecv.map((row, i) => ({
        ...row,
        bps: (i === 0 ? bpsPerRow + remainder : bpsPerRow).toString(),
      })),
    )
  }

  function onSaveSplit(): void {
    setStep1Done(true)
    setToast("Split saved")
  }

  function onGetForwarder(): void {
    setForwarder("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    setToast("Address created")
  }

  function onCopyLink(): void {
    setPaylink("/sender?owner=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
    setToast("Link copied")
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
              Receiver
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
                Define recipients
              </h2>
              <button
                id="btn-even-split-recv"
                onClick={onEvenSplitRecv}
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

            <div style={{ marginBottom: "20px" }}>
              {rowsRecv.map((row, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    id={`addr-recv-${index}`}
                    type="text"
                    placeholder="0x..."
                    value={row.addr}
                    onChange={(e) => {
                      const newRows = [...rowsRecv]
                      newRows[index].addr = e.target.value
                      setRowsRecv(newRows)
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
                    id={`bps-recv-${index}`}
                    type="text"
                    placeholder="bps"
                    value={row.bps}
                    onChange={(e) => {
                      const newRows = [...rowsRecv]
                      newRows[index].bps = e.target.value
                      setRowsRecv(newRows)
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
                id="btn-add-row-recv"
                onClick={addRowRecv}
                style={grayButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#525252")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#737373")}
              >
                Add Row
              </button>
              <button
                id="btn-remove-row-recv"
                onClick={removeRowRecv}
                disabled={rowsRecv.length === 1}
                style={rowsRecv.length === 1 ? grayButtonDisabledStyle : grayButtonStyle}
                onMouseEnter={(e) => {
                  if (rowsRecv.length > 1) e.currentTarget.style.backgroundColor = "#525252"
                }}
                onMouseLeave={(e) => {
                  if (rowsRecv.length > 1) e.currentTarget.style.backgroundColor = "#737373"
                }}
              >
                Remove Row
              </button>
            </div>

            <button
              id="btn-save-split"
              onClick={onSaveSplit}
              style={{
                width: "100%",
                padding: "0.875rem",
                backgroundColor: "#262626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9375rem",
                fontWeight: "600",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
            >
              Save Split
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
                Your payment target
              </h2>

              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <button
                  id="btn-get-forwarder"
                  onClick={onGetForwarder}
                  style={{
                    flex: "1",
                    minWidth: "150px",
                    padding: "0.75rem 1.25rem",
                    backgroundColor: "#262626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
                >
                  Get unique address
                </button>
                <button
                  id="btn-copy-link"
                  onClick={onCopyLink}
                  style={{
                    flex: "1",
                    minWidth: "150px",
                    padding: "0.75rem 1.25rem",
                    backgroundColor: "white",
                    color: "#262626",
                    border: "2px solid #262626",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white"
                  }}
                >
                  Copy payment link
                </button>
              </div>

              {forwarder && (
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
                    }}
                  />
                </div>
              )}

              {paylink && (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: "#404040",
                    }}
                  >
                    Payment link
                  </label>
                  <input
                    id="paylink"
                    type="text"
                    value={paylink}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem",
                      border: "1px solid #d4d4d4",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      backgroundColor: "#f9fafb",
                      color: "#525252",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
