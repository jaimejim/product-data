'use client'

import { useState, useRef, useCallback } from 'react'

interface CameraProps {
  onCapture: (imageBase64: string) => void
  onError?: (error: string) => void
}

export default function Camera({ onCapture, onError }: CameraProps) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (error) {
      onError?.('Camera access denied')
    }
  }, [onError])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.85)
    stopCamera()
    onCapture(imageBase64)
  }, [onCapture, stopCamera])

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
      {isCameraActive && (
        <div className="relative border border-gray-800 bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                className="px-8 py-3 bg-green-600 text-white hover:bg-green-700"
              >
                CAPTURE
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-900 text-gray-400 border border-gray-800 hover:text-white"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {!isCameraActive && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full py-4 bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700 hover:text-white"
          >
            CAMERA
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-900"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-700">or</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-gray-900 text-gray-300 border border-gray-800 hover:border-gray-700 hover:text-white"
          >
            UPLOAD
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
