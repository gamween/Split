"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2

    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)

    const animate = () => {
      ctx.fillStyle = "rgba(250, 250, 250, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 200) {
          p.vx += dx * 0.00005
          p.vy += dy * 0.00005
        }

        p.x += p.vx
        p.y += p.vy

        p.vx *= 0.99
        p.vy *= 0.99

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(100, 100, 100, 0.2)"
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
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
        top: "20px",
        right: "20px",
        backgroundColor: "#1a1a1a",
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {message}
    </div>
  )
}

const grayButtonStyle = {
  padding: "0.5rem 1rem",
  backgroundColor: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: "500",
}

const grayButtonDisabledStyle = {
  ...grayButtonStyle,
  backgroundColor: "#d1d5db",
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
          padding: "40px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "800px", width: "100%" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginBottom: "1.5rem",
              color: "#666",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            ← Home
          </Link>

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "2rem",
              color: "#1a1a1a",
            }}
          >
            Spl!t — Receiver
          </h1>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1a1a1a" }}>Define recipients</h2>
              <button
                id="btn-even-split-recv"
                onClick={onEvenSplitRecv}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Even Split
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              {rowsRecv.map((row, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "0.75rem",
                    flexWrap: "wrap",
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
                      minWidth: "200px",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
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
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <button
                id="btn-add-row-recv"
                onClick={addRowRecv}
                style={grayButtonStyle}
              >
                Add Row
              </button>
              <button
                id="btn-remove-row-recv"
                onClick={removeRowRecv}
                disabled={rowsRecv.length === 1}
                style={rowsRecv.length === 1 ? grayButtonDisabledStyle : grayButtonStyle}
              >
                Remove Row
              </button>
            </div>

            <button
              id="btn-save-split"
              onClick={onSaveSplit}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: "#1a1a1a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              Save Split
            </button>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              border: "1px solid #e5e7eb",
              position: "relative",
            }}
          >
            {!step1Done && (
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  fontSize: "0.75rem",
                  color: "#9ca3af",
                  fontWeight: "500",
                }}
              >
                Step 1 required
              </div>
            )}
            <div style={{ pointerEvents: step1Done ? "auto" : "none", opacity: step1Done ? 1 : 0.5 }}>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                  color: "#1a1a1a",
                }}
              >
                Your payment target
              </h2>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <button
                  id="btn-get-forwarder"
                  onClick={onGetForwarder}
                  style={{
                    flex: "1",
                    minWidth: "150px",
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#1a1a1a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Get unique address
                </button>
                <button
                  id="btn-copy-link"
                  onClick={onCopyLink}
                  style={{
                    flex: "1",
                    minWidth: "150px",
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "white",
                    color: "#1a1a1a",
                    border: "2px solid #1a1a1a",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Copy payment link
                </button>
              </div>

              {forwarder && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
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
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                </div>
              )}

              {paylink && (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
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
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      backgroundColor: "#f9fafb",
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
