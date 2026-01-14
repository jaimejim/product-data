'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  opacity: number
  size: number
}

export default function AsciiClouds() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ASCII characters to use
    const chars = ['o', 'O', '+', 'x', 'X', '·', '∘']

    // Create particles
    const particles: Particle[] = []
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000)

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        char: chars[Math.floor(Math.random() * chars.length)],
        opacity: Math.random() * 0.3 + 0.1,
        size: Math.random() * 8 + 10,
      })
    }

    // Noise function for smooth movement
    let time = 0
    const noise = (x: number, y: number, t: number) => {
      return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t)
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      time += 0.005

      particles.forEach((p) => {
        // Add noise-based movement for organic flow
        const noiseValue = noise(p.x, p.y, time)
        p.vx += noiseValue * 0.02
        p.vy += noiseValue * 0.02

        // Apply velocity with damping
        p.vx *= 0.99
        p.vy *= 0.99

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Wrap around screen edges
        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
        if (p.y < -20) p.y = canvas.height + 20
        if (p.y > canvas.height + 20) p.y = -20

        // Vary opacity over time
        p.opacity = 0.1 + Math.abs(Math.sin(time + p.x * 0.001)) * 0.3

        // Draw character with green tint
        ctx.font = `${p.size}px monospace`
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})` // green-500 with varying opacity
        ctx.fillText(p.char, p.x, p.y)

        // Add occasional brighter highlights
        if (Math.random() > 0.995) {
          ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity * 1.5})` // green-400
          ctx.fillText(p.char, p.x, p.y)
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
