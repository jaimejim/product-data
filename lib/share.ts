import type { AnalysisData } from './types'

const SHARE_KEY_PREFIX = 'share_'
const HASH_LENGTH = 5
const CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateHash(): string {
  let hash = ''
  for (let i = 0; i < HASH_LENGTH; i++) {
    hash += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }
  return hash
}

export async function saveSharedResult(data: AnalysisData, productId?: number): Promise<string> {
  if (typeof window === 'undefined') return ''

  try {
    // Save to database via API
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisData: data, productId }),
    })

    if (response.ok) {
      const result = await response.json()
      if (result.status === 'success' && result.hash) {
        // Also save to localStorage as backup
        const shareData = {
          hash: result.hash,
          timestamp: Date.now(),
          data,
        }
        localStorage.setItem(SHARE_KEY_PREFIX + result.hash, JSON.stringify(shareData))

        return result.hash
      }
    }

    // Fallback to localStorage only if API fails
    console.warn('API save failed, using localStorage fallback')
    const hash = generateHash()
    const shareData = {
      hash,
      timestamp: Date.now(),
      data,
    }
    localStorage.setItem(SHARE_KEY_PREFIX + hash, JSON.stringify(shareData))
    return hash
  } catch (error) {
    console.error('Failed to save shared result:', error)
    // Fallback to localStorage
    const hash = generateHash()
    const shareData = {
      hash,
      timestamp: Date.now(),
      data,
    }
    localStorage.setItem(SHARE_KEY_PREFIX + hash, JSON.stringify(shareData))
    return hash
  }
}

export async function getSharedResult(hash: string): Promise<AnalysisData | null> {
  if (typeof window === 'undefined') return null

  try {
    // Try database first
    const response = await fetch(`/api/share/${hash}`)

    if (response.ok) {
      const result = await response.json()
      if (result.status === 'success' && result.data) {
        // Cache in localStorage for offline access
        const shareData = {
          hash,
          timestamp: Date.now(),
          data: result.data,
        }
        localStorage.setItem(SHARE_KEY_PREFIX + hash, JSON.stringify(shareData))

        return result.data
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(SHARE_KEY_PREFIX + hash)
    if (!stored) return null

    const shareData = JSON.parse(stored)
    return shareData.data
  } catch (error) {
    console.error('Failed to load shared result:', error)

    // Try localStorage fallback
    try {
      const stored = localStorage.getItem(SHARE_KEY_PREFIX + hash)
      if (!stored) return null

      const shareData = JSON.parse(stored)
      return shareData.data
    } catch (fallbackError) {
      return null
    }
  }
}

export async function shareUrl(url: string, title: string): Promise<boolean> {
  // Try native Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
      })
      return true
    } catch (error) {
      // User cancelled or share failed
      return false
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
