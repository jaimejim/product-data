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

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
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
      console.error('Error accessing camera:', error)
      onError?.('Unable to access camera. Please use upload instead.')
    }
  }, [onError])

  // Stop camera stream
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

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    // Compress and convert to base64
    const quality = 0.85 // JPEG quality
    const imageBase64 = canvas.toDataURL('image/jpeg', quality)

    // Stop camera
    stopCamera()

    // Send to parent
    onCapture(imageBase64)
  }, [onCapture, stopCamera])

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError?.('Please select an image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError?.('Image too large. Max 10MB')
        return
      }

      // Read and compress image
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Compress image
          const canvas = canvasRef.current
          if (!canvas) return

          // Calculate new dimensions (max 1920x1080)
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
      {/* Camera view */}
      {isCameraActive && (
        <div className="relative mb-4 border border-gray-700 overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                className="px-8 py-3 bg-green-600 text-white border border-green-500 hover:bg-green-700 transition-colors"
              >
                [capture]
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-3 bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-white transition-colors"
              >
                [cancel]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera controls */}
      {!isCameraActive && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="w-full py-4 bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">📷</span>
            <span>&gt; take_photo</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950 text-gray-600">or</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">📁</span>
            <span>&gt; upload_file</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-xs text-gray-600 text-center pt-2">
            💡 For best results, ensure good lighting and clear focus
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
