'use client'

import { useRef, useCallback } from 'react'

interface CameraProps {
  onCapture: (imageBase64: string) => void
  onError?: (error: string) => void
}

export default function Camera({ onCapture, onError }: CameraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        onError?.('Invalid file type')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        onError?.('File too large')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) return

          let width = img.width
          let height = img.height
          const maxWidth = 1920
          const maxHeight = 1080

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) return

          ctx.drawImage(img, 0, 0, width, height)

          const imageBase64 = canvas.toDataURL('image/jpeg', 0.85)
          onCapture(imageBase64)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    },
    [onCapture, onError]
  )

  return (
    <div className="w-full">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="group relative w-full py-8 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-xl overflow-hidden transition-all duration-300 hover:from-green-500 hover:to-green-400 active:scale-95"
      >
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

        {/* Scan lines effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent animate-scan"></div>
        </div>

        {/* Button content */}
        <div className="relative flex items-center justify-center gap-3">
          <svg
            className="w-8 h-8 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="tracking-wide">SCAN PRODUCT</span>
        </div>

        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-300 opacity-50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-300 opacity-50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-300 opacity-50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-300 opacity-50"></div>
      </button>

      {/* Tiny upload button */}
      <button
        onClick={() => uploadInputRef.current?.click()}
        className="w-full mt-2 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        or upload from gallery
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
