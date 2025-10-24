"use client"

import { useEffect, useRef } from "react"
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

export default function HomePage() {
  return (
    <>
      <InteractiveBackground />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "4rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "#1a1a1a",
            }}
          >
            Spl!t
          </h1>
          <p
            style={{
              fontSize: "1.5rem",
              color: "#666",
              marginBottom: "3rem",
            }}
          >
            Split payments effortlessly
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            <Link
              href="/sender"
              style={{
                width: "100%",
                maxWidth: "28rem",
                height: "3.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.125rem",
                fontWeight: "600",
                backgroundColor: "#1a1a1a",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              I'm a Sender
            </Link>
            <Link
              href="/receiver"
              style={{
                width: "100%",
                maxWidth: "28rem",
                height: "3.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.125rem",
                fontWeight: "600",
                backgroundColor: "white",
                color: "#1a1a1a",
                border: "2px solid #1a1a1a",
                borderRadius: "0.75rem",
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              I'm a Receiver
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
