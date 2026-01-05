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

export function saveSharedResult(data: AnalysisData): string {
  if (typeof window === 'undefined') return ''

  try {
    // Generate a unique hash
    let hash = generateHash()
    let attempts = 0

    // Ensure uniqueness (max 10 attempts)
    while (localStorage.getItem(SHARE_KEY_PREFIX + hash) && attempts < 10) {
      hash = generateHash()
      attempts++
    }

    // Save to localStorage
    const shareData = {
      hash,
      timestamp: Date.now(),
      data,
    }

    localStorage.setItem(SHARE_KEY_PREFIX + hash, JSON.stringify(shareData))

    return hash
  } catch (error) {
    console.error('Failed to save shared result:', error)
    return ''
  }
}

export function getSharedResult(hash: string): AnalysisData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(SHARE_KEY_PREFIX + hash)
    if (!stored) return null

    const shareData = JSON.parse(stored)
    return shareData.data
  } catch (error) {
    console.error('Failed to load shared result:', error)
    return null
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
