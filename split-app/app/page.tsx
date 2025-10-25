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

      ctx.fillStyle = "#ffffff"
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

export default function HomePage() {
  const [showAbout, setShowAbout] = useState(false)

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
        {/* About button - top right */}
        <button
          onClick={() => setShowAbout(true)}
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            padding: "0.625rem 1.25rem",
            backgroundColor: "transparent",
            color: "#404040",
            border: "1px solid #d4d4d4",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
            transition: "all 0.15s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#262626"
            e.currentTarget.style.color = "white"
            e.currentTarget.style.borderColor = "#262626"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent"
            e.currentTarget.style.color = "#404040"
            e.currentTarget.style.borderColor = "#d4d4d4"
          }}
        >
          About
        </button>

        {/* About modal */}
        {showAbout && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 100,
            }}
            onClick={() => setShowAbout(false)}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "32px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAbout(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#737373",
                  cursor: "pointer",
                  padding: "4px 8px",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#171717")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
              >
                ×
              </button>

              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#171717",
                  marginBottom: "24px",
                  marginTop: 0,
                }}
              >
                About
              </h2>

              <div style={{ marginBottom: "24px" }}>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: "1.7",
                    color: "#404040",
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  My name is Sofiane Ben Taleb. Aspiring engineer specializing in market finance at ESILV (Paris — La Défense). Interested in trading, structuring, sales, and quantitative research. Skilled in Python for data analysis and modeling, leveraging mathematics and computer science to build a strong foundation for a career in investment banking and asset management.
                </p>

                <p
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: "1.7",
                    color: "#404040",
                    margin: 0,
                  }}
                >
                  Spl!t is built to standardize how we share payments. Instead of calculating splits manually, chasing reimbursements, or relying on trust, Spl!t creates one reusable payment address that automatically distributes funds according to a preset split. Once the split is saved, you just send once — and everyone gets their share instantly and transparently. This is the first step toward making the "last mile" of finance — the everyday transactions between friends, coworkers, and small groups — simple, fair, and universal.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  paddingTop: "20px",
                  borderTop: "1px solid #e5e5e5",
                }}
              >
                <a
                  href="https://github.com/gamween"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#262626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#404040")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#262626")}
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/sofiane-ben-taleb-bb0154378/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#0077b5",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#006399")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0077b5")}
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        )}

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
              I'm a Receiver (beta)
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
