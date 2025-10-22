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

export default function SenderPage() {
  const [rows, setRows] = useState<{ addr: string; bps: string }[]>([{ addr: "", bps: "" }])
  const [owner, setOwner] = useState<string>("")
  const [amount, setAmount] = useState<string>("0.01")
  const [toast, setToast] = useState<string>("")

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
    setToast("Split saved")
  }

  function onSendTip(): void {
    setToast("Tip sent")
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
            Spl!t — Sender
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
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1a1a1a" }}>Configure my split</h2>
              <button
                id="btn-even-split"
                onClick={onEvenSplit}
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
              {rows.map((row, index) => (
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
                      minWidth: "200px",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
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
                id="btn-add-row"
                onClick={addRow}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Add Row
              </button>
              <button
                id="btn-remove-row"
                onClick={removeRow}
                disabled={rows.length === 1}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: rows.length === 1 ? "#d1d5db" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: rows.length === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Remove Row
              </button>
            </div>

            <button
              id="btn-set-split"
              onClick={onSetSplit}
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
              Set Split
            </button>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "1.5rem",
                color: "#1a1a1a",
              }}
            >
              Send Tip
            </h2>

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
                Owner address
              </label>
              <input
                id="owner"
                type="text"
                placeholder="0x..."
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
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
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <button
              id="btn-send-tip"
              onClick={onSendTip}
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
              Send Tip
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
