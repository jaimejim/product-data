'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResultCard from '../components/ResultCard'
import AsciiClouds from '../components/AsciiClouds'
import { getSharedResult } from '@/lib/share'
import type { AnalysisData } from '@/lib/types'

export default function SharedProductPage({ params }: { params: { hash: string } }) {
  const router = useRouter()
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hash = params.hash

    // Validate hash format (5 alphanumeric characters)
    if (!/^[a-z0-9]{5}$/.test(hash)) {
      setLoading(false)
      return
    }

    // Fetch shared result (async)
    getSharedResult(hash).then((result) => {
      setData(result)
      setLoading(false)
    }).catch(() => {
      setData(null)
      setLoading(false)
    })
  }, [params.hash])

  const handleBack = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black font-mono text-white relative">
        <AsciiClouds />
        <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
          <div className="py-16 text-center">
            <div className="text-green-400 animate-pulse">LOADING</div>
          </div>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black font-mono text-white relative">
        <AsciiClouds />
        <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
          <div className="py-16 space-y-6">
            <div className="border border-red-900 bg-red-950/30 p-6">
              <div className="text-red-400 mb-4">NOT FOUND</div>
              <p className="text-red-300 text-sm mb-6">
                This shared product could not be found.
              </p>
              <button
                onClick={handleBack}
                className="w-full py-3 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              >
                GO HOME
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black font-mono text-white relative">
      <AsciiClouds />
      <div className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <ResultCard result={data} isCached={false} onReset={handleBack} shareHash={params.hash} />
      </div>
    </main>
  )
}
