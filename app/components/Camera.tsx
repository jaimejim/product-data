'use client'

import { useRef, useCallback } from 'react'

interface CameraProps {
  onCapture: (imageBase64: string) => void
  onError?: (error: string) => void
}

export default function Camera({ onCapture, onError }: CameraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        className="w-full py-4 bg-green-600 text-white hover:bg-green-700 font-bold"
      >
        SCAN
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
